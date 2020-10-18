import Client from './client';

async function main() {
  const client = new Client('localhost:9080');
  // TODO: other stuff here
  client.close();
}

main();