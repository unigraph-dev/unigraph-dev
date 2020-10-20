import express, { Request } from 'express';
import { Server } from 'http';
import expressWs, { Application } from 'express-ws';
import { isJsonString } from './utils';
import Client from './client';
import { EventEmitter } from 'ws';

const PORT = 3000;
const verbose = 1;

export default async function startServer(client: Client) {
  let app: Application;
  let dgraphClient = client;

  type EventMessage = {
    "type": "event",
    "event": string
  };

  const eventRouter: Record<string, Function> = {
    "query_by_string_with_vars": async function (event: EventMessage & {query: string, vars: Object, id: number}, ws: {send: Function}) {
      let res = await dgraphClient.queryData<any[]>(event.query, event.vars)
      console.log(res)
      dgraphClient.queryData<any[]>(event.query, event.vars).then(res => {
        ws.send(JSON.stringify({"type": "response", "id": event.id, "foo": "bar", "result": res}))
      }).catch(e => console.log(e));
    },

    "set_schema": function (event: EventMessage, ws: {send: Function}) {

    },

    "create_data_by_json": function (event: EventMessage, ws: {send: Function}) {

    },

    "drop_data": function (event: EventMessage & {id: number}, ws: {send: Function}) {
      dgraphClient.dropData().then(_ => {
        ws.send(JSON.stringify({"type": "response", "id": event.id, "success": true}))
      }).catch(e => ws.send(JSON.stringify({"type": "response", "id": event.id, "success": false, "error": e})))
    },
  
    "drop_all": function (event: EventMessage & {id: number}, ws: {send: Function}) {
      dgraphClient.dropAll().then(_ => {
        ws.send(JSON.stringify({"type": "response", "id": event.id, "success": true}))
      }).catch(e => ws.send(JSON.stringify({"type": "response", "id": event.id, "success": false, "error": e})))
    },
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
        }
      });
      console.log('opened socket connection');
    });

    const server = app.listen(PORT, () => {
      res(server);
      console.log('\nListening on port', PORT);
    });
  });

  return [app!, server] as const;
}