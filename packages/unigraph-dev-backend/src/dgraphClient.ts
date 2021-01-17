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

  async getStatus() {
    let count: any[][] = await this.queryDgraph(`{
      objects(func: type(Entity)) {
        totalObjects : count(uid)
      }
      schemas(func: type(Type)) {
        totalSchemas : count(uid)
      }
    }`, {});
    return {
      "version": await (await this.dgraphClientStub.checkVersion(new Check())).toString(),
      "objects": count[0][0].totalObjects,
      "schemas": count[1][0].totalSchemas
    }
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

  async createData(data: Record<string, any>, test = false) {
    const txn = this.dgraphClient.newTxn();
    try {

      const mu = new Mutation();
      mu.setSetJson(data);
      const response = await txn.mutate(mu);

      await txn.commit();

      if (test) {
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
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      await txn.discard();
    }
  }

  async createMutation(data: any[]) {
    const txn = this.dgraphClient.newTxn();
    try {
      let mutations: Mutation[] = data.map((obj: any) => {
        let mu = new dgraph.Mutation();
        mu.setSetJson(obj);
        return mu;
      });
      const req = new dgraph.Request();
      req.setMutationsList(mutations);
      req.setCommitNow(true);

      await txn.doRequest(req);
    } catch (e) {
      console.error('Error: ', e);
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
      const querybody = data.queries.join('\n');
      const querystr = `query {
        ${querybody}
      }`;
      let mutations: Mutation[] = data.mutations.map((obj: any) => {
        let mu = new dgraph.Mutation();
        mu.setSetJson(obj);
        return mu;
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

  /**
   * Perform a standard RDF-style SPO update on Dgraph. Must provide a UID, predicate, and value.
   * 
   * Caveats: 
   * 1. Doesn't work with references - will be updated later
   * 
   * @param s Subject
   * @param p Predicate
   * @param o Object
   */
  async updateSPO(s: string, p: string, o: any) { // TODO Security
    return new Promise((resolve, reject) => {
      if (typeof o === "object") reject("Can't update the target when it's an object!");
      let txn = this.dgraphClient.newTxn();
      let mu = new dgraph.Mutation();
      mu.setSetNquads(`<${s}> <${p}> "${o.toString()}" .`);
      const req = new dgraph.Request();
      req.setCommitNow(true);
      req.setMutationsList([mu]);
      txn.doRequest(req).then(resolve).catch(reject);
    })
    
  }

  /**
   * Executes a raw query directly on dgraph that is not type safe.
   * @param query 
   * @param vars 
   */
  async queryDgraph(query: string, vars: Record<string, any>|undefined = undefined): Promise<any[]> {
    const res = await this.dgraphClient
      .newTxn({ readOnly: true })
      .queryWithVars(query, vars);
    return Object.values(res.getJson());
  }

  // Some helpful functions for unigraph

  /**
   * Queries the database for objects with a unigraph.id.
   * @param id The desired id to query
   */
  async queryUnigraphId<T = unknown>(id: string) {
    return this.queryData<T>(`
    query findByName($a: string) {
      entities(func: eq(unigraph.id, $a)) {
        expand(_predicate_)
      }
    }
  `, {$a: id})
  }

  async getSchemas() {
    return this.queryData<any[]>(`
    query findByName() {
      entities(func: eq(dgraph.type, "Type")) @recurse(depth: 10) {
        uid
        expand(_predicate_)
      }
    }
  `, {})
  }

  async deleteUnigraphObject(uid: string) {
    return this.createData({
      uid: uid,
      "dgraph.type": "Deleted"
    })
  }

  close() {
    this.dgraphClientStub.close();
  }
}