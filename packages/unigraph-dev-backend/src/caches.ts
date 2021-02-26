// Abstract definition for caches

import DgraphClient from "./dgraphClient";

type data = any;

export type Cache = {
    data: data,
    updateNow(): data,
    cacheType: "subscription" | "manual",
    /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
    subscribe(listener: Function): any
}

// Caches

export function createSchemaCache(client: DgraphClient): Cache {

    const cache: Cache = {
        data: {},
        updateNow: async () => null,
        cacheType: "manual",
        subscribe: (listener) => null
    };

    cache.updateNow = async () => { 
        const newdata = await client.getSchemas();
        cache.data = newdata.reduce((prev, obj) => {
            if (obj && typeof obj["unigraph.id"] === "string" && obj["unigraph.id"].startsWith('$/schema/')) {
                prev[obj["unigraph.id"]] = obj;
            }
            return prev;
        }, {})
    };

    cache.updateNow();

    return cache;
}