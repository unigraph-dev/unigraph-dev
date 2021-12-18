import Client from './dgraphClient';
import startServer from './server';

async function main() {
  const args = process.argv.slice(2);
  const dgraphAddress = args[0] || 'localhost:9080';
  const client = new Client(dgraphAddress);
  const [app, server] = await startServer(client);

  server.on('close', () => (console.log('CLOSING'), client.close()));
}

main();