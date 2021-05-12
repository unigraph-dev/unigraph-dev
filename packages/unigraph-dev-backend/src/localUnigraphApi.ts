import { buildGraph, getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { Unigraph } from "unigraph-dev-common/lib/types/unigraph";
import { processAutorefUnigraphId, makeQueryFragmentFromType, clearEmpties, buildUnigraphEntity, processAutoref, getUpsertFromUpdater } from "unigraph-dev-common/lib/utils/entityUtils";
import { UnigraphUpsert } from "./custom";
import DgraphClient, { queries } from "./dgraphClient";
import { buildExecutable } from "./executableManager";
import { callHooks } from "./hooks";
import { addNotification } from "./notifications";
import { Subscription, createSubscriptionLocal } from "./subscriptions";
import { insertsToUpsert } from "./utils/txnWrapper";
import { Cache } from './caches';

export function getLocalUnigraphAPI(client: DgraphClient, states: {caches: Record<string, Cache<any>>, subscriptions: Subscription[], hooks: any}): Unigraph {
    const messages: any[] = [];
    const eventTarget: any = {};

    return {
        backendConnection: false,
        backendMessages: messages,
        eventTarget: eventTarget,
        buildGraph: buildGraph,
        // latertodo
        getStatus: () => {throw Error("Not implemented")},
        createSchema: async (schemain) => {
            const autorefSchema = processAutorefUnigraphId(schemain);
            const upsert: UnigraphUpsert = insertsToUpsert([autorefSchema]);
            await client.createUnigraphUpsert(upsert);
            await states.caches['schemas'].updateNow();
            await states.caches['packages'].updateNow();
            callHooks(states.hooks, "after_schema_updated", {caches: caches});
        },
        // latertodo
        ensureSchema: async (name, fallback) => {return Error('Not implemented')},
        // latertodo
        ensurePackage: async (packageName, fallback) => {return Error('Not implemented')},
        subscribeToType: async (name, callback: any, eventId = undefined) => {
            eventId = getRandomInt();
            const queryAny = queries.queryAny(getRandomInt().toString());
            const query = name === "any" ? queryAny : `(func: uid(par${eventId})) 
            ${makeQueryFragmentFromType(name, states.caches["schemas"].data)}
            par${eventId} as var(func: has(type)) @filter((NOT type(Deleted)) AND type(Entity)) @cascade {
                type @filter(eq(<unigraph.id>, "${name}"))
            }`
            const newSub = createSubscriptionLocal(eventId, callback, query);
            states.subscriptions.push(newSub);
            callHooks(states.hooks, "after_subscription_added", {newSubscriptions: states.subscriptions});
        },
        subscribeToObject: async (uid, callback: any, eventId = undefined) => {
            eventId = getRandomInt();
            const frag = `(func: uid(${uid})) @recurse { uid expand(_predicate_) }`
            const newSub = createSubscriptionLocal(eventId, callback, frag);
            states.subscriptions.push(newSub);
            callHooks(states.hooks, "after_subscription_added", {newSubscriptions: states.subscriptions});
        },
        subscribeToQuery: async (fragment, callback: any, eventId = undefined) => {
            eventId = getRandomInt();
            const query = `(func: uid(par${eventId})) @recurse {uid expand(_predicate_)}
            par${eventId} as var${fragment}`
            const newSub = createSubscriptionLocal(eventId, callback, query);
            states.subscriptions.push(newSub);
            callHooks(states.hooks, "after_subscription_added", {newSubscriptions: states.subscriptions});
        },
        unsubscribe: async (id) => {
            states.subscriptions = states.subscriptions.reduce((prev: Subscription[], curr: Subscription) => {
                if (curr.id === id) return prev;
                else {prev.push(curr); return prev}
            }, []);
        },
        addObject: async (object, schema) => {
            clearEmpties(object);
            console.log(object)
            const unigraphObject = buildUnigraphEntity(object, schema, states.caches['schemas'].data);
            const finalUnigraphObject = processAutoref(unigraphObject, schema, states.caches['schemas'].data)
            const upsert = insertsToUpsert([finalUnigraphObject]);
            await client.createUnigraphUpsert(upsert);
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches})
        },
        getType: async (name) => {
            const eventId = getRandomInt();
            const queryAny = `query {entities(func: type(Entity)) @recurse { uid expand(_predicate_) }}`
            const query = name === "any" ? queryAny : `query {entities(func: uid(par${eventId})) 
            ${makeQueryFragmentFromType(name, states.caches["schemas"].data)}
            par${eventId} as var(func: has(type)) @filter((NOT type(Deleted)) AND type(Entity)) @cascade {
                type @filter(eq(<unigraph.id>, "${name}"))
            }}`
            const res = await client.queryData(query);
            return res;
        },
        getQueries: async (fragments) => {
            const allQueries = fragments.map((it, index) => `query${index}(func: uid(par${index})) @recurse {uid expand(_predicate_)}
            par${index} as var${it}`);
            const res = await client.queryDgraph(`query {${allQueries.join('\n')}}`);
            return res;
        },
        deleteObject: async (uid) => {
            await client.deleteUnigraphObject(uid);
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches})
        },
        // latertodo
        updateSimpleObject: async (object, predicate, value) => {throw Error("Not implemented")},
        updateObject: async (uid, newObject, isUpsert = true, pad = true) => {
            const origObject = (await client.queryUID(uid))[0];
            let finalUpdater = newObject;
            if (pad) {
                const schema = origObject['type']['unigraph.id'];
                const paddedUpdater = buildUnigraphEntity(newObject, schema, states.caches['schemas'].data, true, {validateSchema: true, isUpdate: true});
                finalUpdater = processAutoref(paddedUpdater, schema, states.caches['schemas'].data);
            } else {
                finalUpdater = processAutorefUnigraphId(finalUpdater);
            }
            const upsert = getUpsertFromUpdater(origObject, finalUpdater);
            console.log(finalUpdater, upsert)
            const finalUpsert = insertsToUpsert([upsert]);
            console.log(finalUpsert)
            await client.createUnigraphUpsert(finalUpsert);
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches})
        },
        // latertodo
        getReferenceables: async (key = "unigraph.id", asMapWithContent = false) => {return Error('Not implemented')},
        getSchemas: async (schemas: string[] | undefined, resolve = false) => {
            return states.caches['schemas'].data;
        },
        getPackages: async (packages) => {
            return states.caches['packages'].data;
        },
        // latertodo
        proxyFetch: async (url, options?) => {return new Blob([])},
        // latertodo
        importObjects: async (objects) => {return Error('Not implemented')},
        runExecutable: async (unigraphid, params) => {
            const exec = states.caches["executables"].data[unigraphid];
            buildExecutable(exec, {"params": params, "definition": exec}, {} as Unigraph)()
        },
        addNotification: async (notification) => {
            await addNotification(notification, states.caches, client);
            //console.log(hooks)
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches})
        },
        addState: (...params) => {throw Error('Not available in server side')},
        getState: (...params) => {throw Error('Not available in server side')},
        deleteState: (...params) => {throw Error('Not available in server side')},
    }
}