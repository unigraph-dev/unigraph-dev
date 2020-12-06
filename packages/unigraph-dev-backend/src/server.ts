import express, { Request } from 'express';
import { Server } from 'http';
import expressWs, { Application, WebsocketRequestHandler } from 'express-ws';
import { isJsonString } from './utils/utils';
import DgraphClient from './dgraphClient';
import { insertsToUpsert } from './utils/txnWrapper';
import { EventCreateDataByJson, EventCreateUnigraphObject, EventCreateUnigraphSchema, EventDropAll, EventDropData, EventQueryByStringWithVars, EventSetDgraphSchema, IWebsocket, UnigraphUpsert } from './custom';
import { buildUnigraphEntity } from './utils/entityUtils';
import { checkOrCreateDefaultDataModel } from './datamodelManager';
import { Cache, createSchemaCache } from './caches';

const PORT = 3001;
const verbose = 5;

export default async function startServer(client: DgraphClient) {
  let app: Application;
  let dgraphClient = client;
  let caches: Record<string, Cache> = {};
  
  // Basic checks
  await checkOrCreateDefaultDataModel(client);

  // Initialize managers
  caches["schemas"] = createSchemaCache(client);
  console.log(caches["schemas"]);

  const makeResponse = (event: {id: number}, success: boolean, body: object) => {
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
        ws.send(makeResponse(event, true, {}));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    "create_data_by_json": function (event: EventCreateDataByJson, ws: IWebsocket) {
      dgraphClient.createData(event.data).then(_ => {
        ws.send(makeResponse(event, true, {}));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    "drop_data": function (event: EventDropData, ws: IWebsocket) {
      dgraphClient.dropData().then(_ => {
        ws.send(makeResponse(event, true, {}))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },
  
    "drop_all": function (event: EventDropAll, ws: IWebsocket) {
      dgraphClient.dropAll().then(_ => {
        ws.send(makeResponse(event, true, {}))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
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
        ws.send(makeResponse(event, true, {}))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    /**
     * Creates one unigraph object entity in dgraph.
     * @param event The event for creating the object
     * @param ws Websocket connection
     */
    "create_unigraph_object": function (event: EventCreateUnigraphObject, ws: IWebsocket) {
      // TODO: Talk about schema verifications
      let finalUnigraphObject = buildUnigraphEntity(event.object, event.schema, false, event.padding);
      let upsert = insertsToUpsert([finalUnigraphObject]);
      dgraphClient.createUnigraphUpsert(upsert).then(_ => {
        ws.send(makeResponse(event, true, {}))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
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
          if (msgObject && msgObject.type === "event" && msgObject.event && eventRouter[msgObject.event]) {
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

  return [app!, server] as const;
}