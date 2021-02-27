import express, { Request, response } from 'express';
import { Server } from 'http';
import expressWs, { Application, WebsocketRequestHandler } from 'express-ws';
import { isJsonString, blobToBase64 } from 'unigraph-dev-common/lib/utils/utils';
import DgraphClient from './dgraphClient';
import { insertsToUpsert } from './utils/txnWrapper';
import { EventCreateDataByJson, EventCreateUnigraphObject, EventCreateUnigraphSchema, EventDeleteUnigraphObject, EventDropAll, EventDropData, EventEnsureUnigraphSchema, EventGetSchemas, EventProxyFetch, EventQueryByStringWithVars, EventResponser, EventSetDgraphSchema, EventSubscribeObject, EventSubscribeType, EventUnsubscribeById, EventUpdateObject, EventUpdateSPO, IWebsocket, UnigraphUpsert } from './custom';
import { buildUnigraphEntity, getUpsertFromUpdater, makeQueryFragmentFromType, processAutoref } from 'unigraph-dev-common/lib/utils/entityUtils';
import { checkOrCreateDefaultDataModel } from './datamodelManager';
import { Cache, createSchemaCache } from './caches';
import repl from 'repl';
import { createSubscriptionWS, MsgCallbackFn, pollSubscriptions, Subscription } from './subscriptions';
import { callHooks, HookAfterObjectChangedParams, HookAfterSchemaUpdatedParams, HookAfterSubscriptionAddedParams, Hooks } from './hooks';
import { getAsyncLock } from './asyncManager';
import fetch from 'node-fetch';

const PORT = 3001;
const verbose = 5;

export default async function startServer(client: DgraphClient) {
  let app: Application;
  const dgraphClient = client;

  const pollInterval = 10000;

  const caches: Record<string, Cache> = {};
  let subscriptions: Subscription[] = [];

  const lock = getAsyncLock();


  // Basic checks
  await checkOrCreateDefaultDataModel(client);

  // Initialize caches
  caches["schemas"] = createSchemaCache(client);

  // Initialize subscriptions
  const pollCallback: MsgCallbackFn = (id, newdata, msgPort) => {
    if(msgPort.readyState === 1) msgPort.send(JSON.stringify({
      type: "subscription",
      updated: true,
      id: id,
      result: newdata
    }))};

  setInterval(() => pollSubscriptions(subscriptions, dgraphClient, pollCallback), pollInterval);

  const hooks: Hooks = {
    "after_subscription_added": [(context: HookAfterSubscriptionAddedParams) => {
      pollSubscriptions(context.newSubscriptions, dgraphClient, pollCallback);
    }],
    "after_schema_updated": [(context: HookAfterSchemaUpdatedParams) => {
      context.newCaches["schemas"].updateNow();
    }],
    "after_object_changed": [(context: HookAfterObjectChangedParams) => {
      pollSubscriptions(context.subscriptions, dgraphClient, pollCallback);
    }],
  }
  
  

  const makeResponse = (event: {id: number | string}, success: boolean, body: Record<string, unknown> = {}) => {
    return JSON.stringify({
      type: "response",
      success: success,
      id: event.id,
      ...body
    })
  }

  const eventRouter: Record<string, EventResponser> = {
    "query_by_string_with_vars": function (event: EventQueryByStringWithVars, ws: IWebsocket) {
      dgraphClient.queryData<any[]>(event.query, event.vars).then(res => {
        ws.send(makeResponse(event, true, {"result": res}));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    "set_dgraph_schema": function (event: EventSetDgraphSchema, ws: IWebsocket) {
      dgraphClient.setSchema(event.schema).then(_ => {
        ws.send(makeResponse(event, true));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    "create_data_by_json": function (event: EventCreateDataByJson, ws: IWebsocket) {
      dgraphClient.createData(event.data).then(_ => {
        callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        ws.send(makeResponse(event, true));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    "drop_data": function (event: EventDropData, ws: IWebsocket) {
      dgraphClient.dropData().then(_ => {
        ws.send(makeResponse(event, true))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },
  
    "drop_all": function (event: EventDropAll, ws: IWebsocket) {
      dgraphClient.dropAll().then(_ => {
        ws.send(makeResponse(event, true))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    "subscribe_to_object": function (event: EventSubscribeObject, ws: IWebsocket) {
      const newSub = createSubscriptionWS(event.id, ws, event.queryFragment);
      subscriptions.push(newSub);
      callHooks(hooks, "after_subscription_added", {newSubscriptions: subscriptions});
      ws.send(makeResponse(event, true));
    },

    "subscribe_to_type": function (event: EventSubscribeType, ws: IWebsocket) {
      const queryAny = `(func: type(Entity)) @recurse { uid expand(_predicate_) }`
      const query = event.schema === "any" ? queryAny : `(func: uid(par${event.id})) 
      ${makeQueryFragmentFromType(event.schema, caches["schemas"].data)}
      par${event.id} as var(func: has(type)) @filter(NOT type(Deleted)) @cascade {
        type @filter(eq(<unigraph.id>, "${event.schema}"))
      }`
      console.log(query)
      eventRouter["subscribe_to_object"]({...event, queryFragment: query}, ws)
    },

    "unsubscribe_by_id": function (event: EventUnsubscribeById, ws: IWebsocket) {
      subscriptions = subscriptions.reduce((prev: Subscription[], curr: Subscription) => {
        if (curr.id === event.id) return prev;
        else {prev.push(curr); return prev}
      }, []);
      ws.send(makeResponse(event, true));
    },

    "ensure_unigraph_schema": function (event: EventEnsureUnigraphSchema, ws: IWebsocket) {
      const names = Object.keys(caches["schemas"].data);
      if (names.includes(event.name)) {
        ws.send(makeResponse(event, true));
      } else {
        // Falls back to create nonexistent schema
        eventRouter["create_unigraph_schema"]({...event, schema: event.fallback}, ws);
      }
    },

    /**
     * Creates unigraph schema entity(s) in dgraph.
     * @param event The event for creating the schema
     * @param ws Websocket connection
     */
    "create_unigraph_schema": function (event: EventCreateUnigraphSchema, ws: IWebsocket) {
      /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
      lock.acquire('caches/schema', function (done: Function) {
        const schema = (Array.isArray(event.schema) ? event.schema : [event.schema]);
        const upsert: UnigraphUpsert = insertsToUpsert(schema);
        dgraphClient.createUnigraphUpsert(upsert).then(_ => {
          ws.send(makeResponse(event, true));
          callHooks(hooks, "after_schema_updated", {caches: caches});
          done(true, null)
        }).catch(e => {ws.send(makeResponse(event, false, {"error": e})); done(false, null)});
      })
      
    },

    "delete_unigraph_object": function (event: EventDeleteUnigraphObject, ws: IWebsocket) {
      dgraphClient.deleteUnigraphObject(event.uid).then(_ => {
        callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        ws.send(makeResponse(event, true));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    /**
     * Creates one unigraph object entity in dgraph.
     * 
     * Basically the procedure is like [Build padded entity based on schema and object] =>
     * [Do autoref checks based on schema] => [Convert to upsert if we're using Dgraph as backend]
     * 
     * @param event The event for creating the object
     * @param ws Websocket connection
     */
    "create_unigraph_object": function (event: EventCreateUnigraphObject, ws: IWebsocket) {
      // TODO: Talk about schema verifications
      const unigraphObject = buildUnigraphEntity(event.object, event.schema, caches['schemas'].data);
      const finalUnigraphObject = processAutoref(unigraphObject, event.schema, caches['schemas'].data)
      console.log(JSON.stringify(finalUnigraphObject, null, 4))
      const upsert = insertsToUpsert([finalUnigraphObject]);
      dgraphClient.createUnigraphUpsert(upsert).then(_ => {
        callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        ws.send(makeResponse(event, true))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    "update_spo": function (event: EventUpdateSPO, ws: IWebsocket) {
      dgraphClient.updateSPO(event.uid, event.predicate, event.value).then(_ => {
        callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        ws.send(makeResponse(event, true))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    /**
     * Updates an object given its uid and new object.
     * 
     * There are two methods of update: using or not using upsert.
     * This choice is represented in the "upsert" property of the event.
     * If upsert is false (currently not implemented), Unigraph will NOT care about whatever currently in object and overwrite;
     * In upsert false mode, non-specified fields will be deleted (dereferenced). 
     * You can use "$upsert": true to identify which part to use upsert; Note that this cannot be nested in a upsert=false object.
     *
     * @param event The event for update. Detailed options for the event is outlined above.
     * @param ws Websocket connection
     */
    "update_object": async function (event: EventUpdateObject, ws: IWebsocket) {
      if (typeof event.upsert === "boolean" && !event.upsert) {
        ws.send(makeResponse(event, false, {"error": "non-upsert mode is not implemented!"})) // TODO: implement shis
      } else { // upsert mode
        const origObject = (await dgraphClient.queryUID(event.uid))[0];
        const schema = origObject['type']['unigraph.id'];
        const paddedUpdater = buildUnigraphEntity(event.newObject, schema, caches['schemas'].data);
        const finalUpdater = processAutoref(paddedUpdater, schema, caches['schemas'].data);
        const upsert = getUpsertFromUpdater(origObject, finalUpdater);
        //console.log(upsert);
        const finalUpsert = insertsToUpsert([upsert]);
        dgraphClient.createUnigraphUpsert(finalUpsert).then(_ => {
          callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
          ws.send(makeResponse(event, true))
        }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
      }
    },

    "get_status": async function (event: any, ws: IWebsocket) {
      const status = {
        "dgraph": await dgraphClient.getStatus(),
        "unigraph": {
          "cache": {
            "length": Object.values(caches).length,
            "names": Object.keys(caches),
          },
          "subscription": {
            "length": subscriptions.length,
          }
        }
      }
      ws.send(makeResponse(event, true, status))
    },

    "get_schemas": async function (event: EventGetSchemas, ws: IWebsocket) {
      // TODO: Option to get only a couple of schemas in cache
      ws.send(makeResponse(event, true, {"schemas": caches['schemas'].data}));
    },

    "proxy_fetch": async function (event: EventProxyFetch, ws: IWebsocket) {
      // TODO: Using node-fetch here for now; if we move to deno later we can replace it.
      // https://stackoverflow.com/questions/54099802/blob-to-base64-in-nodejs-without-filereader
      console.log('yo2')
      fetch(event.url, event.options)
        .then(res => res.buffer())
        .then(buffer => ws.send(makeResponse(event, true, {"blob": buffer.toString('base64')})))
        .catch(err => ws.send(makeResponse(event, false, {error: err})))
    }
  };

  const server = await new Promise<Server>(res => {
    ({ app } = expressWs(express()));

    // TODO pull into separate express.Router
    app.ws('/', (ws, req) => {
      ws.on('message', (msg: string) => {
        const msgObject: {type: string | null, event: string | null} = isJsonString(msg)
        if (msgObject) {
          // match events
          if (msgObject.type === "event" && msgObject.event && eventRouter[msgObject.event]) {
            if (verbose >= 1) console.log("matched event: " + msgObject.event);
            eventRouter[msgObject.event](msgObject, ws);
          }
          if (verbose >= 2) console.log(msgObject);
        } else {
          console.log("Message received is not JSON!");
          console.log(msg)
        }
      });
      ws.send(JSON.stringify({
        "type": "hello"
      }))
      console.log('opened socket connection');
    });

    const server = app.listen(PORT, () => {
      res(server);
      console.log('\nListening on port', PORT);
    });
  });

  const debugServer = repl.start("unigraph> ");
  // @ts-ignore /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
  debugServer.context.unigraph = {caches: caches, dgraphClient: client, server: server, subscriptions: subscriptions};

  return [app!, server] as const;
}