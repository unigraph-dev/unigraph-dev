import { Unigraph } from "unigraph-dev-common";

declare global {
    interface Window {
        unigraph: Unigraph;
    }
};