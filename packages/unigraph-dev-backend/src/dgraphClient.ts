import dgraph, { DgraphClient as ActualDgraphClient, DgraphClientStub, Operation, Mutation, Check } from 'dgraph-js';
import { UnigraphUpsert } from './custom';

/**
 * Example client, adapted from:
 *   https://github.com/dgraph-io/dgraph-js/blob/master/examples/simple/index.js
 */
export default class DgraphClient {
  private dgraphClient: ActualDgraphClient;
  private dgraphClientStub: DgraphClientStub;

  constructor(connectionUri: string) {
    this.dgraphClientStub = new DgraphClientStub(connectionUri);
    this.dgraphClientStub.checkVersion(new Check()).catch(e => {if (e.code === 14) {
      throw new Error("Could not establish connection to Dgraph client, exiting...");
    }})
    this.dgraphClient = new ActualDgraphClient(this.dgraphClientStub);
    // TODO(haojixu): Check if default db exists - if not, set default
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

  /**
   * Creates data from a upsert request (i.e. query for data then use the result to mutate).
   * @param {UnigraphUpsert} data 
   */
  async createUnigraphUpsert(data: UnigraphUpsert) {
    const txn = this.dgraphClient.newTxn();
    try {
      const querybody = data.queries.reduce((accu, current) => {return accu + "\n" + current});
      const querystr = `query {
        ${querybody}
      }`;
      let mutations: Mutation[] = [];
      data.mutations.forEach((obj: any) => {
        let mu = new dgraph.Mutation();
        mu.setSetJson(obj);
        mutations.push(mu);
      });
      const req = new dgraph.Request();
      req.setQuery(querystr);
      req.setMutationsList(mutations);
      req.setCommitNow(true);

      await txn.doRequest(req);
    } catch (e) {
      console.error('Error: ', e);
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