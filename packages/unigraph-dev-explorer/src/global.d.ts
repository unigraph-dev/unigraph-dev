import { Unigraph } from "./unigraph";

declare global {
    interface Window {
        unigraph: Unigraph;
    }
};