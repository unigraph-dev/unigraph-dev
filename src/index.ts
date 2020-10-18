import Client from './client';
import startServer from './server';

async function main() {
  const [app, server] = await startServer();
  const client = new Client('localhost:9080');

  app.use((req, res, next) => {
    req.dgraph = client;
    next();
  });

  server.on('close', () => (console.log('CLOSING'), client.close()));
}

main();