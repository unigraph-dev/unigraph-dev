import Client from './dgraphClient';
import startServer from './server';

async function main() {
    const client = new Client('localhost', { grpc: '9080', zero: '6080' });
    const [app, server] = await startServer(client, process.env.UNIGRAPH_RECOVERY_MODE === 'true');

    server.on('close', () => (console.log('CLOSING'), client.close()));
}

main();
