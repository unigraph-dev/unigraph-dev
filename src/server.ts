import express from 'express';
import { Server } from 'http';
import expressWs, { Application } from 'express-ws';

const PORT = 3000;

export default async function startServer() {
  let app: Application;

  const server = await new Promise<Server>(res => {
    ({ app } = expressWs(express()));

    // TODO pull into separate express.Router
    app.ws('/', (ws, req) => {
      ws.on('message', (msg) => {
        console.log(msg);
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