// Abstract definition for caches

import DgraphClient from "./dgraphClient";

export type Cache<T> = {
    data: T,
    updateNow(): any,
    cacheType: "subscription" | "manual",
    /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
    subscribe(listener: Function): any
}