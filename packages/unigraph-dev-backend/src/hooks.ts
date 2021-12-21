import _ from "lodash";
import { Cache } from "./caches";
import DgraphClient from "./dgraphClient";
import { Subscription } from "./subscriptions";
import { mergeWithConcatArray } from "./utils";

/* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
export type Hooks = Record<string, Function[]>

export async function callHooks<T>(hooks: Hooks, type: string, context: T) {
    if (Object.keys(hooks).includes(type)) await Promise.all(hooks[type].map(val => val(context)));
}

export function addHook(hooks: Hooks, type: string, fn: any) {
    return _.mergeWith({}, hooks, {[type]: [fn]}, mergeWithConcatArray);
}

// Default hooks
export type HookAfterSubscriptionAddedParams = { 
    subscriptions: Subscription[],
    ids?: any[] | undefined,
}

export type HookAfterSchemaUpdatedParams = {
    caches: Record<string, Cache<any>>,
}

export type HookAfterObjectChangedParams = {
    subscriptions: Subscription[],
    caches: Record<string, Cache<any>>,
    subIds?: any[],
}

export async function initEntityHeads (states: any, schemas: string[], client: DgraphClient) {
    const queries = schemas.map((el, index) => `query${index} (func: eq(<unigraph.id>, "${el}")) {
        uid
        <~type> (first: -1) {
            uid
        }
    }`);
    const res: any[] = await client.queryDgraph(`query { ${queries.join('\n')} }`);
    const newHeads = res.map((el, index) => [schemas[index], (el[0]?.['~type']?.[0].uid || "0x1")]);
    states.entityHeadByType = Object.fromEntries(newHeads);
}

export async function afterObjectCreatedHooks (states: any, hooks: Record<string, any[]>, client: DgraphClient) {
    const queries = Object.keys(hooks).map((el, index) => `query${index} (func: eq(<unigraph.id>, "${el}")) {
        uid
        <~type> (after: ${states.entityHeadByType[el]}) {
            uid
        }
    }`);
    const res: any[] = await client.queryDgraph(`query { ${queries.join('\n')} }`);
    const newEntities = res.map((el) => (el[0]?.['~type'] || []).map((el: any) => el.uid));
    newEntities.forEach((el, index) => { if (el.length > 0) states.entityHeadByType[Object.keys(hooks)[index]] = el[el.length - 1] });
    // Call hooks based on objects created
    newEntities.forEach((el, index) => {
        if (el.length > 0) {
            Object.values(hooks)[index].forEach(it => it({uids: el}));
        }
    });
}