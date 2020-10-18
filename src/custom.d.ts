import DgraphClient from './client';

declare global {
  namespace Express {
    interface Request {
      dgraph: DgraphClient;
    }
  }
}