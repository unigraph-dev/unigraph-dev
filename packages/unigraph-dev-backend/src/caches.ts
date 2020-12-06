// Abstract definition for caches

import DgraphClient from "./dgraphClient";

type data = any;

export type Cache = {
    data: data,
    updateNow(): data,
    cacheType: "subscription" | "when-needed",
    subscribe(listener: Function): any
}

// Caches

export function createSchemaCache(client: DgraphClient): Cache {

    let cache: Cache = {
        data: [],
        updateNow: async () => null,
        cacheType: "when-needed",
        subscribe: (listener) => null
    };

    cache.updateNow = async () => cache.data = client.getSchemas();

    cache.updateNow();

    return cache;
}