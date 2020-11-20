import DgraphClient from './dgraphClient';

declare global {
  namespace Express {
    interface Request {
      dgraph: DgraphClient;
    }
  }
}