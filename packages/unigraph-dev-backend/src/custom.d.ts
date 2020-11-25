import DgraphClient from './dgraphClient';

declare global {
  namespace Express {
    interface Request {
      dgraph: DgraphClient;
    }
  }
}

declare type UnigraphUpsert = {
  queries: string[],
  mutations: any[]
}