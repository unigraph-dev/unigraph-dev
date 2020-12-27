import express, { Request } from 'express';
import { Server } from 'http';
import expressWs, { Application, WebsocketRequestHandler } from 'express-ws';
import { isJsonString } from './utils/utils';
import DgraphClient from './dgraphClient';
import { insertsToUpsert } from './utils/txnWrapper';
import { EventCreateDataByJson, EventCreateUnigraphObject, EventCreateUnigraphSchema, EventDeleteUnigraphObject, EventDropAll, EventDropData, EventEnsureUnigraphSchema, EventQueryByStringWithVars, EventSetDgraphSchema, EventSubscribeObject, EventSubscribeType, EventUnsubscribeById, EventUpdateSPO, IWebsocket, UnigraphUpsert } from './custom';
import { buildUnigraphEntity, makeQueryFragmentFromType } from './utils/entityUtils';
import { checkOrCreateDefaultDataModel } from './datamodelManager';
import { Cache, createSchemaCache } from './caches';
import repl from 'repl';
import { createSubscriptionWS, MsgCallbackFn, pollSubscriptions, Subscription } from './subscriptions';
import { callHooks, HookAfterObjectChangedParams, HookAfterSchemaUpdatedParams, HookAfterSubscriptionAddedParams, Hooks } from './hooks';

const PORT = 3001;
const verbose = 5;

export default async function startServer(client: DgraphClient) {
  let app: Application;
  let dgraphClient = client;

  const pollInterval = 1000;

  let caches: Record<string, Cache> = {};
  let subscriptions: Subscription[] = [];


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

  let hooks: Hooks = {
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
  
  

  const makeResponse = (event: {id: number | string}, success: boolean, body: object = {}) => {
    return JSON.stringify({
      type: "response",
      success: success,
      id: event.id,
      ...body
    })
  }

  const eventRouter: Record<string, Function> = {
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
      let newSub = createSubscriptionWS(event.id, ws, event.queryFragment);
      subscriptions.push(newSub);
      callHooks(hooks, "after_subscription_added", {newSubscriptions: subscriptions});
      ws.send(makeResponse(event, true));
    },

    "subscribe_to_type": function (event: EventSubscribeType, ws: IWebsocket) {
      let queryAny = `(func: type(Entity)) @recurse { uid expand(_predicate_) }`
      let query = event.schema === "any" ? queryAny : `(func: uid(par${event.id})) 
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
        else {prev.push(curr); return prev};
      }, []);
      ws.send(makeResponse(event, true));
    },

    "ensure_unigraph_schema": function (event: EventEnsureUnigraphSchema, ws: IWebsocket) {
      let names = Object.keys(caches["schemas"].data);
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
      let schema = (Array.isArray(event.schema) ? event.schema : [event.schema]);
      let upsert: UnigraphUpsert = insertsToUpsert(schema);
      dgraphClient.createUnigraphUpsert(upsert).then(_ => {
        ws.send(makeResponse(event, true));
        callHooks(hooks, "after_schema_updated", {caches: caches});
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    "delete_unigraph_object": function (event: EventDeleteUnigraphObject, ws: IWebsocket) {
      dgraphClient.deleteUnigraphObject(event.uid).then(_ => {
        callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        ws.send(makeResponse(event, true));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    /**
     * Creates one unigraph object entity in dgraph.
     * @param event The event for creating the object
     * @param ws Websocket connection
     */
    "create_unigraph_object": function (event: EventCreateUnigraphObject, ws: IWebsocket) {
      // TODO: Talk about schema verifications
      let finalUnigraphObject = buildUnigraphEntity(event.object, event.schema, caches['schemas'].data);
      console.log(JSON.stringify(finalUnigraphObject, null, 4))
      let upsert = insertsToUpsert([finalUnigraphObject]);
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

    "get_status": async function (event: any, ws: IWebsocket) {
      let status = {
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
    }
  };

  const server = await new Promise<Server>(res => {
    ({ app } = expressWs(express()));

    // TODO pull into separate express.Router
    app.ws('/', (ws, req) => {
      ws.on('message', (msg: string) => {
        let msgObject: {type: string | null, event: string | null} = isJsonString(msg)
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

  let debugServer = repl.start("unigraph> ");
  // @ts-ignore
  debugServer.context.unigraph = {caches: caches, dgraphClient: client, server: server, subscriptions: subscriptions};

  return [app!, server] as const;
}