import AsyncLock from 'async-lock';
import dgraph, { DgraphClient as ActualDgraphClient, DgraphClientStub, Operation, Mutation, Check } from 'dgraph-js';
import { getAsyncLock, withLock } from './asyncManager';
import { UnigraphUpsert } from './custom';

/**
 * Example client, adapted from:
 *   https://github.com/dgraph-io/dgraph-js/blob/master/examples/simple/index.js
 */
export default class DgraphClient {
  private dgraphClient: ActualDgraphClient;
  private dgraphClientStub: DgraphClientStub;
  private txnlock: AsyncLock

  constructor(connectionUri: string) {
    this.dgraphClientStub = new DgraphClientStub(connectionUri, undefined, {'grpc.max_receive_message_length': 1024 * 1024 * 1024});
    this.dgraphClientStub.checkVersion(new Check()).catch(e => {if (e.code === 14) {
      throw new Error("Could not establish connection to Dgraph client, exiting...");
    }})
    this.dgraphClient = new ActualDgraphClient(this.dgraphClientStub);
    // TODO(haojixu): Check if default db exists - if not, set default
    this.txnlock = getAsyncLock();
  }

  async getStatus() {
    const count: any[][] = await this.queryDgraph(`{
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
      const mutations: Mutation[] = data.map((obj: any) => {
        const mu = new dgraph.Mutation();
        mu.setSetJson(obj);
        return mu;
      });
      const req = new dgraph.Request();
      req.setMutationsList(mutations);
      req.setCommitNow(true);

      await withLock(this.txnlock, 'txn', () => txn.doRequest(req));
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
  async createUnigraphUpsert(data: UnigraphUpsert, test = false) {
    /* eslint-disable */
    !test ? true : console.log("Trying to create upsert....============================================")
    const txn = this.dgraphClient.newTxn();
    let response: dgraph.Response;
    try {
      const querybody = data.queries.join('\n');
      const querystr = `query {
        ${querybody}
      }`;
      const mutations: Mutation[] = [...data.mutations, ...data.appends].map((obj: any, index) => {
        const mu = new dgraph.Mutation();
        mu.setSetJson((data.mutations.includes(obj) && obj && !obj.uid) ? {...obj, uid: `_:upsert${index}`} : obj);
        !test ? true : console.log(JSON.stringify(obj, null, 2))
        return mu;
      });
      /* eslint-disable */
      !test ? true : console.log(querystr)
      const req = new dgraph.Request();
      /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
      data.queries.length ? req.setQuery(querystr) : false;
      req.setMutationsList(mutations);
      req.setCommitNow(true);

      response = await withLock(this.txnlock, 'txn', () => txn.doRequest(req));
      !test ? true : console.log(JSON.stringify(response, null, 2))
      
    } catch (e) {
      console.error('Error: ', e);
    } finally {
      await txn.discard();
    }
    /* eslint-disable */
    !test ? true : console.log("upsert details above================================================")
    return data.mutations.map((el, index) => response.getUidsMap().get(el.uid ? (el.uid.startsWith('_:') ? el.uid.slice(2) : el.uid) : `upsert${index}`));
  }

  async createDgraphUpsert(data: {query: string | false, mutations: Mutation[]}) {
    const txn = this.dgraphClient.newTxn();
    let response;
    try {
      const req = new dgraph.Request();
      if (data.query) req.setQuery(data.query);
      req.setMutationsList(data.mutations);
      req.setCommitNow(true);
      response = await withLock(this.txnlock, 'txn', () => txn.doRequest(req));
    } catch (e) {
      console.error('Error: ', e);
    } finally {
      await txn.discard();
    }
    return response;
  }

  async deleteRelationbyJson(data: any) {
    const txn = this.dgraphClient.newTxn();
    const mu = new dgraph.Mutation();
    mu.setDeleteJson(data);
    return await withLock(this.txnlock, 'txn', () => txn.mutate(mu));;
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
  async updateSPO(s: string, p: string, o: any) { // TODO: Security
    return new Promise((resolve, reject) => {
      if (typeof o === "object") reject("Can't update the target when it's an object!");
      const txn = this.dgraphClient.newTxn();
      const mu = new dgraph.Mutation();
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
      .queryWithVars(query, vars).catch(e => {console.log(e); return e});
    const tns = res.getLatency().getTotalNs();
    if (tns > 100000000) console.log(`[PERF] Slow - Transaction complete - but took ${tns / 1000000.0} ms. ` + query.slice(0, 100) + '...')
    return Object.values(res.getJson());
  }

  /**
   * Queries a UID.
   * @param uid
   */
  async queryUID(uid: string): Promise<any> {
    const res = await this.dgraphClient
      .newTxn({ readOnly: true })
      .queryWithVars('query yo($a: string) { e(func: uid($a)) @recurse {uid unigraph.id expand(_userpredicate_)} }', {$a: uid});
    return Object.values(res.getJson())[0];
  }

  // Some helpful functions for unigraph

  /**
   * Queries the database for objects with a unigraph.id.
   * @param id The desired id to query
   */
  async queryUnigraphId<T = unknown>(id: string) {
    return this.queryData<T>(`
    query findByName($a: string) {
      entities(func: eq(unigraph.id, $a)) @recurse {
        unigraph.id
        expand(_userpredicate_)
      }
    }
  `, {$a: id})
  }

  async getSchemas() {
    return this.queryData<any[]>(`
    query findByName() {
      entities(func: eq(dgraph.type, "Type")) @recurse {
        uid
        unigraph.id
        expand(_userpredicate_)
      }
    }
  `, {})
  }

  /** Only get schemas that are registered through the package manager. */
  async getSchemasFromTable() {
    return (await this.queryData<any[]>(`
    query findByName() {
      entities(func: eq(unigraph.id, "$/meta/namespace_map")) @recurse {
        uid
        unigraph.id
        expand(_userpredicate_)
      }
    }
  `, {}))[0]
  }

  async getTextSearchResults(search: string, display: any) {
    const res = (await this.queryDgraph(display === "indexes" ? queries['querySearch_indexes'](search) : queries['querySearch'](search)));
    return {results: res[0] as any[], entities: res[4] as any[]};
  }

  async getPackages() {
    return this.queryData<any[]>(`
    query findByName() {
      entities(func: eq(dgraph.type, "Package")) @recurse {
        uid
        unigraph.id
        expand(_userpredicate_)
      }
    }
  `, {})
  }

  async getExecutables() {
    return this.queryData<any[]>(`
    query findByName() {
      entities(func: eq(dgraph.type, "Executable")) @recurse {
        uid
        unigraph.id
        expand(_userpredicate_)
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

export const queries: Record<string, (a: string, uidsOnly?: boolean) => string> = {
  "querySearch": (search: string) => `query {
    q(func:alloftext(<_value.%>, "${search}")) {
       uid
      <_value.%>
      <unigraph.origin> {
        uu as uid
      }
    }
    qq(func: uid(uu)) {
      uid
      <unigraph.origin> {
        uuu as uid
      }
    }
    qqq(func: uid(uuu)) {
      uid
      <unigraph.origin> {
        uuuu as uid
      }
    }
    qqqq(func: uid(uuuu)) {
      uid
      <unigraph.origin> {
        uuuuu as uid
      }
    }
    qqqqq(func: uid(uuuuu, uuuu, uuu, uu)) @filter(type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) @recurse(depth: 15) {
      uid
      expand(_userpredicate_)
      unigraph.id
    }
  }`,
  
  "querySearch_indexes": (search: string) => `query {
    q(func:alloftext(<_value.%>, "${search}")) {
       uid
      <_value.%>
      <unigraph.origin> {
        uu as uid
      }
    }
    qq(func: uid(uu)) {
      uid
      <unigraph.origin> {
        uuu as uid
      }
    }
    qqq(func: uid(uuu)) {
      uid
      <unigraph.origin> {
        uuuu as uid
      }
    }
    qqqq(func: uid(uuuu)) {
      uid
      <unigraph.origin> {
        uuuuu as uid
      }
    }
    qqqqq(func: uid(uuuuu, uuuu, uuu, uu)) @filter(type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) {
      uid
      type {
        unigraph.id
      }
      unigraph.id
      unigraph.indexes {
        uid 
        expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
          uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
      }
    }
  }`,

  "queryAny": (a: any, uidsOnly?: boolean) => `(func: uid(es${a}), orderdesc: val(cca${a}), first: 100) ${uidsOnly ? "{uid}" : `@recurse(depth: 15) {
    uid
    unigraph.id
    expand(_userpredicate_)
  }`}
  
  es${a} as var(func: type(Entity)) @filter((NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true)))
    { 
      _timestamp {
				ca${a} as _updatedAt
      }
      cca${a} as min(val(ca${a}))
    }`,
  "queryAnyAll": (a: any, uidsOnly?: boolean) => `(func: uid(es${a}), orderdesc: val(cca${a})) ${uidsOnly ? "{uid}" : `@recurse {
      uid
      unigraph.id
      expand(_userpredicate_)
    }`}
    
    es${a} as var(func: type(Entity)) @filter((NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true)))
      { 
        _timestamp {
          ca${a} as _updatedAt
        }
        cca${a} as min(val(ca${a}))
      }`,
  "queryAny-withInh": (_) => `(func: type(Entity)) @recurse { uid unigraph.id expand(_userpredicate_) }`
}