/**
 * This module contains functions that handle executables and their functionalities.
 */

import DgraphClient from "./dgraphClient";
import { buildUnigraphEntity, getUpsertFromUpdater, makeQueryFragmentFromType, processAutoref, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { buildGraph, getRandomInt, Unigraph } from "unigraph-dev-common/lib/api/unigraph";
import { Cache } from './caches';
import { createContext } from "react";
import cron from 'node-cron';
import { createSubscriptionLocal, Subscription } from "./subscriptions";
import { callHooks } from "./hooks";
import { insertsToUpsert } from "./utils/txnWrapper";
import { UnigraphUpsert } from "./custom";

export type Executable = {
    name?: string,
    "unigraph.id": string,
    src: string,
    env: string,
    periodic?: string,
    editable?: boolean,
    edited?: boolean,
    semantic_properties?: any
}

export function createExecutableCache(client: DgraphClient, context: ExecContext, unigraph: Unigraph): Cache<any> {
    
    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: "manual",
        subscribe: (listener) => null
    };

    cache.updateNow = async () => { 
        const newdata = await client.getExecutables();
        cache.data = newdata.reduce((prev, obj) => {
            obj = unpad(obj);
            if (obj && obj["unigraph.id"]) {
                prev[obj["unigraph.id"]] = obj;
            }
            return prev;
        }, {})

        initExecutables(Object.values(cache.data), context, unigraph)
    };

    cache.updateNow();

    return cache;

}

export function buildExecutable(exec: Executable, context: ExecContext, unigraph: Unigraph): any {
    if (Object.keys(environmentRunners).includes(exec.env)) {
        // @ts-expect-error: already checked for environment runner inclusion
        return environmentRunners[exec.env](exec.src, context, unigraph);
    }
    return undefined;
}

export function initExecutables(executables: Executable[], context: ExecContext, unigraph: Unigraph) {
    executables.forEach(el => {
        if (el.periodic) cron.schedule(el.periodic, buildExecutable(el, context, unigraph))
    })
}

/** Routines */

export type ExecContext = {
    // TODO: add context specifications
}

/**
 * A type of functions that "runs" the executable once. 
 */
export type ExecRunner = (src: string, context: ExecContext, unigraph: Unigraph) => () => any;

export const runEnvRoutineJs: ExecRunner = (src, context, unigraph) => {
    //const fn = () => eval(src);
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const fn = new AsyncFunction("context", "unigraph", src).bind(this, context, unigraph);

    return fn;
}

/** Environments */

export const environmentRunners = {"routine/js": runEnvRoutineJs} /** List of all environments supported in Unigraph */

export function getLocalUnigraphAPI(client: DgraphClient, caches: Record<string, Cache<any>>, subscriptions: Subscription[], hooks: any): Unigraph {
    const messages: any[] = [];
    const eventTarget: any = {};

    return {
        backendConnection: false,
        backendMessages: messages,
        eventTarget: eventTarget,
        unpad: unpad,
        buildGraph: buildGraph,
        // latertodo
        getStatus: () => {throw Error("Not implemented")},
        createSchema: async (schemain) => {
            const schema = (Array.isArray(schemain) ? schemain : [schemain]);
            const upsert: UnigraphUpsert = insertsToUpsert(schema);
            await client.createUnigraphUpsert(upsert);
            await caches['schemas'].updateNow();
            await caches['packages'].updateNow();
            callHooks(hooks, "after_schema_updated", {caches: caches});
        },
        // latertodo
        ensureSchema: async (name, fallback) => {},
        // latertodo
        ensurePackage: async (packageName, fallback) => {},
        subscribeToType: async (name, callback: any, eventId = undefined) => {
            eventId = getRandomInt();
            const queryAny = `(func: type(Entity)) @recurse { uid expand(_predicate_) }`
            const query = name === "any" ? queryAny : `(func: uid(par${eventId})) 
            ${makeQueryFragmentFromType(name, caches["schemas"].data)}
            par${eventId} as var(func: has(type)) @filter((NOT type(Deleted)) AND type(Entity)) @cascade {
                type @filter(eq(<unigraph.id>, "${name}"))
            }`
            const newSub = createSubscriptionLocal(eventId, callback, query);
            subscriptions.push(newSub);
            callHooks(hooks, "after_subscription_added", {newSubscriptions: subscriptions});
        },
        subscribeToObject: async (uid, callback: any, eventId = undefined) => {
            eventId = getRandomInt();
            const frag = `(func: uid(${uid})) @recurse { uid expand(_predicate_) }`
            const newSub = createSubscriptionLocal(eventId, callback, frag);
            subscriptions.push(newSub);
            callHooks(hooks, "after_subscription_added", {newSubscriptions: subscriptions});
        },
        subscribeToQuery: async (fragment, callback: any, eventId = undefined) => {
            eventId = getRandomInt();
            const query = `(func: uid(par${eventId})) @recurse {uid expand(_predicate_)}
            par${eventId} as var${fragment}`
            const newSub = createSubscriptionLocal(eventId, callback, query);
            subscriptions.push(newSub);
            callHooks(hooks, "after_subscription_added", {newSubscriptions: subscriptions});
        },
        unsubscribe: async (id) => {
            subscriptions = subscriptions.reduce((prev: Subscription[], curr: Subscription) => {
                if (curr.id === id) return prev;
                else {prev.push(curr); return prev}
            }, []);
        },
        addObject: async (object, schema) => {
            const unigraphObject = buildUnigraphEntity(object, schema, caches['schemas'].data);
            const finalUnigraphObject = processAutoref(unigraphObject, schema, caches['schemas'].data)
            const upsert = insertsToUpsert([finalUnigraphObject]);
            await client.createUnigraphUpsert(upsert);
            callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        },
        getType: async (name) => {
            const eventId = getRandomInt();
            const queryAny = `query {entities(func: type(Entity)) @recurse { uid expand(_predicate_) }}`
            const query = name === "any" ? queryAny : `query {entities(func: uid(par${eventId})) 
            ${makeQueryFragmentFromType(name, caches["schemas"].data)}
            par${eventId} as var(func: has(type)) @filter((NOT type(Deleted)) AND type(Entity)) @cascade {
                type @filter(eq(<unigraph.id>, "${name}"))
            }}`
            const res = await client.queryData(query);
            return res;
        },
        deleteObject: async (uid) => {
            await client.deleteUnigraphObject(uid);
            callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        },
        // latertodo
        updateSimpleObject: async (object, predicate, value) => {throw Error("Not implemented")},
        updateObject: async (uid, newObject) => {
            const origObject = (await client.queryUID(uid))[0];
            const schema = origObject['type']['unigraph.id'];
            const paddedUpdater = buildUnigraphEntity(newObject, schema, caches['schemas'].data);
            const finalUpdater = processAutoref(paddedUpdater, schema, caches['schemas'].data);
            const upsert = getUpsertFromUpdater(origObject, finalUpdater);
            const finalUpsert = insertsToUpsert([upsert]);
            await client.createUnigraphUpsert(finalUpsert);
            callHooks(hooks, "after_object_changed", {subscriptions: subscriptions, caches: caches})
        },
        // latertodo
        getReferenceables: async (key = "unigraph.id", asMapWithContent = false) => {},
        getSchemas: async (schemas: string[] | undefined, resolve = false) => {
            return caches['schemas'].data;
        },
        getPackages: async (packages) => {
            return caches['packages'].data;
        },
        // latertodo
        proxyFetch: async (url, options?) => {return new Blob([])},
        // latertodo
        importObjects: async (objects) => {},
        runExecutable: async (unigraphid) => {
            const exec = caches["executables"].data[unigraphid];
            buildExecutable(exec, {"hello": "ranfromExecutable"}, {} as Unigraph)()
        }
    }
}