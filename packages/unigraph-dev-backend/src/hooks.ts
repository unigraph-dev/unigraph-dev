import _ from 'lodash';
import { Cache } from './caches';
import DgraphClient from './dgraphClient';
import { Subscription } from './custom.d';

/* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
export type Hooks = Record<string, Function[]>

export async function callHooks<T>(hooks: Hooks, type: string, context: T) {
    if (Object.keys(hooks).includes(type)) await Promise.all(hooks[type].map(val => val(context)));
}

export function addHook(hooks: Hooks, type: string, fn: any) {
    if (Array.isArray(hooks[type])) {
        hooks[type].push(fn);
    } else {
        hooks[type] = [fn];
    }
    return hooks;
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
    ofUpdate?: any,
    changedUids?: string[],
    bulk?: boolean,
}

export async function initEntityHeads (states: any, schemas: string[], client: DgraphClient) {
    const queries = schemas.map((el, index) => `query${index} (func: eq(<unigraph.id>, "${el}")) {
        uid
        <~type> (first: 1, orderdesc: _createdAt) {
            uid
            _createdAt
        }
    }`);
    const res: any[] = await client.queryDgraph(`query { ${queries.join('\n')} }`);
    const newHeads = res.map((el, index) => [schemas[index], (el[0]?.['~type']?.[0]._createdAt || "1970-01-01T00:00:00.000Z")]);
    states.entityHeadByType = Object.fromEntries(newHeads);
}

export async function afterObjectCreatedHooks (states: any, hooks: Record<string, any[]>, client: DgraphClient) {
    if (Object.keys(hooks).length === 0) return;
    const queries = Object.keys(hooks).map((el, index) => `query${index} (func: eq(<unigraph.id>, "${el}")) {
        uid
        <~type> @filter(gt(_createdAt, "${states.entityHeadByType[el]}")) (orderdesc: _createdAt) {
            uid
            _createdAt
        }
    }`);
    const res: any[] = await client.queryDgraph(`query { ${queries.join('\n')} }`);
    const newEntities = res.map((el) => (el[0]?.['~type'] || []).map((el: any) => el.uid));
    newEntities.forEach((el, index) => { if (el.length > 0) states.entityHeadByType[Object.keys(hooks)[index]] = (res[index][0]?.['~type']?.[0]?._createdAt || new Date().toISOString()); });
    // Call hooks based on objects created
    newEntities.forEach((el, index) => {
        if (el.length > 0) {
            Object.values(hooks)[index].forEach(it => it({uids: el}));
        }
    });
}

export function createUidListCache(
    client: DgraphClient,
): Cache<any> {
    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: 'manual',
        subscribe: (listener) => null,
    };

    cache.updateNow = async () => {
        const newdata = await client.getUidLists();

        cache.data = Object.fromEntries(
            newdata.map((el: any) => ["$/"+el['unigraph.id'].split('/').slice(4).join('/'), (el['_value['] || []).map((it: any) => it._value.uid)])
        );
    };

    cache.updateNow();

    return cache;
}

export async function afterObjectUpdatedHooks (
    states: any, 
    hooks: Record<string, any[]>, 
    hooksAllUpdated: any[], // TODO: remove this
    client: DgraphClient, 
    changedUids: string[],
    uidLists: Record<string, string[]>
) {
    // console.log(hooks, changedUids, uidLists);
    if (Object.keys(hooks).length === 0 && !hooksAllUpdated?.length) return;
    Object.keys(hooks).map((uidListName) => {
        if (!hooks[uidListName]?.length) return;
        const list = uidLists[uidListName];
        const totalChangedUids = _.intersection(list, changedUids);
        if (totalChangedUids.length === 0) return;
        hooks[uidListName].forEach(it => it({uids: totalChangedUids}));
    })
    // hooksAllUpdated.forEach(it => it({uids: changedUids}));
}

// Set up debounced hooks call for global updated hooks
export function setupGlobalUpdatedHooks () {
    let changedUids: string[] = [];
    const debouncedCall = _.debounce((hooksAllUpdated, changedUids) => {
        const toCallUids: string[] = [...changedUids];
        changedUids.length = 0;

        hooksAllUpdated.forEach((it: any) => it({uids: toCallUids}));
    }, 6000, {
        leading: false,
        trailing: true,
        maxWait: 12000,
    });
    
    return {
        regGlobalUpdatedHooks: function (
            tchangedUids: string[],
            hooksAllUpdated: any[],
        ) {
            changedUids = _.uniq([...changedUids, ...tchangedUids]);
            debouncedCall(hooksAllUpdated, changedUids);
        }
    }
}