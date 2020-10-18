import { DgraphClient, DgraphClientStub, Operation, Mutation } from 'dgraph-js';

/**
 * Example client, adapted from:
 *   https://github.com/dgraph-io/dgraph-js/blob/master/examples/simple/index.js
 */
export default class Client {
  dgraphClient: DgraphClient;
  dgraphClientStub: DgraphClientStub;

  constructor(connectionUri: string) {
    this.dgraphClientStub = new DgraphClientStub(connectionUri);
    this.dgraphClient = new DgraphClient(this.dgraphClientStub);
  }

  async dropAll() {
    const op = new Operation();
    op.setDropAll(true);
    await this.dgraphClient.alter(op);
  }

  async dropData() {
    const op = new Operation();
    op.setDropOp(Operation.DropOp.DATA);
    await this.dgraphClient.alter(op);
  }

  async setSchema(schema: string) {
    const op = new Operation();
    op.setSchema(schema);
    await this.dgraphClient.alter(op);
  }

  async createData(data: Record<string, any>) {
    const txn = this.dgraphClient.newTxn();
    try {

      const mu = new Mutation();
      mu.setSetJson(data);
      const response = await txn.mutate(mu);

      await txn.commit();

      const resolvedUid = response
        .getUidsMap()
        .get(data.uid.slice(2));

      console.log(
        `Created node named '${data.name}' with uid = ${resolvedUid}\n`,
      );

      console.log('All created nodes:');
      const uids = response.getUidsMap();
      uids.forEach((uid, key) => console.log(`${key} => ${uid}`));
      console.log();
    } catch (e) {
      console.error('Error:', e);
    } finally {
      await txn.discard();
    }
  }

  async queryData<T = unknown>(query: string, vars: Record<string, any> = {}) {
    const res = await this.dgraphClient
      .newTxn({ readOnly: true })
      .queryWithVars(query, vars);
    return Object.values(res.getJson())[0] as T;
  }

  close() {
    this.dgraphClientStub.close();
  }
}