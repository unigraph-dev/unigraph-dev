import { buildGraph, getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { Unigraph } from "unigraph-dev-common/lib/types/unigraph";
import { processAutorefUnigraphId, makeQueryFragmentFromType, clearEmpties, buildUnigraphEntity, processAutoref, getUpsertFromUpdater, flatten, unflatten } from "unigraph-dev-common/lib/utils/entityUtils";
import { UnigraphUpsert } from "./custom";
import DgraphClient, { queries } from "./dgraphClient";
import { buildExecutable } from "./executableManager";
import { callHooks } from "./hooks";
import { addNotification } from "./notifications";
import { Subscription, createSubscriptionLocal } from "./subscriptions";
import { insertsToUpsert } from "unigraph-dev-common/lib/utils/txnWrapper";
import { Cache } from './caches';
import dgraph from "dgraph-js";
import path from "path";

export function getLocalUnigraphAPI(client: DgraphClient, states: {caches: Record<string, Cache<any>>, subscriptions: Subscription[], hooks: any, namespaceMap: any, localApi: Unigraph, httpCallbacks: any}): Unigraph {
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
            callHooks(states.hooks, "after_subscription_added", {newSubscriptions: states.subscriptions, ids: [eventId]});
        },
        subscribeToObject: async (uid, callback: any, eventId = undefined) => {
            eventId = getRandomInt();
            const frag = `(func: uid(${uid})) @recurse { uid unigraph.id expand(_userpredicate_) }`
            const newSub = createSubscriptionLocal(eventId, callback, frag);
            states.subscriptions.push(newSub);
            callHooks(states.hooks, "after_subscription_added", {newSubscriptions: states.subscriptions, ids: [eventId]});
        },
        subscribeToQuery: async (fragment, callback: any, eventId = undefined, noExpand) => {
            eventId = getRandomInt();
            const query = (noExpand || fragment.startsWith('$/executable/')) ? fragment : `(func: uid(par${eventId})) @recurse {uid unigraph.id expand(_userpredicate_)}
            par${eventId} as var${fragment}`
            const newSub = createSubscriptionLocal(eventId, callback, query);
            states.subscriptions.push(newSub);
            callHooks(states.hooks, "after_subscription_added", {newSubscriptions: states.subscriptions, ids: [eventId]});
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
            console.log(finalUnigraphObject);
            const upsert = insertsToUpsert([finalUnigraphObject]);
            const uids = await client.createUnigraphUpsert(upsert);
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches});
            return uids;
        },
        getNamespaceMapUid: (name) => {
            return states.namespaceMap[name].uid;
        },
        getType: async (name) => {
            const eventId = getRandomInt();
            const queryAny = `query {entities(func: type(Entity)) @recurse { uid unigraph.id expand(_userpredicate_) }}`
            const query = name === "any" ? queryAny : `query {entities(func: uid(par${eventId})) 
            ${makeQueryFragmentFromType(name, states.caches["schemas"].data)}
            par${eventId} as var(func: has(type)) @filter((NOT type(Deleted)) AND type(Entity)) @cascade {
                type @filter(eq(<unigraph.id>, "${name}"))
            }}`
            const res = await client.queryData(query);
            return res;
        },
        getQueries: async (fragments, getAll = false, batch = 50) => {
            let allQueries;
            if (getAll) allQueries = fragments.map((it, index) => `query${index}(func: uid(par${index})) @recurse {uid unigraph.id expand(_userpredicate_)}
            par${index} as var${it}`)
            else allQueries = fragments.map((it, index) => `query${index}${it}`)
            if (!batch) batch = allQueries.length;
            const batchedQueries = allQueries.reduce((resultArray, item, index) => { 
                const chunkIndex = Math.floor(index/batch)
              
                if(!resultArray[chunkIndex]) {
                  resultArray[chunkIndex] = [] // start a new chunk
                }
              
                resultArray[chunkIndex].push(item)
              
                return resultArray
              }, [] as any)
            const res: any[] = [];
            for (let i=0; i<batchedQueries.length; ++i) {
                res.push(...(await client.queryDgraph(`query {${batchedQueries[i].join('\n')}}`)))
            }
            return res;
        },
        deleteObject: async (uid) => {
            await client.deleteUnigraphObject(uid);
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches})
        },
        // latertodo
        updateSimpleObject: async (object, predicate, value) => {throw Error("Not implemented")},
        updateObject: async (uid, newObject, isUpsert = true, pad = true, subIds) => {
            clearEmpties(newObject);
            const newUid = uid ? uid : newObject.uid
            // Get new object's unigraph.origin first
            console.log("update: 1")
            let origin = newObject['unigraph.origin'] ? newObject['unigraph.origin'] : (await client.queryData<any>(`query { entity(func: uid(${newUid})) { <unigraph.origin> { uid } }}`, []))[0]?.['unigraph.origin']
            if (!Array.isArray(origin)) origin = [origin];
            console.log("update: 2", uid)
            const origObject = (await client.queryUID(uid))[0];
            let finalUpdater = newObject;
            console.log("update: 3", uid)
            try {
                if (pad) {
                    const schema = origObject['type']['unigraph.id'];
                    const paddedUpdater = buildUnigraphEntity(newObject, schema, states.caches['schemas'].data, true, {validateSchema: true, isUpdate: true, states: {}, globalStates: {}});
                    finalUpdater = processAutoref(paddedUpdater, schema, states.caches['schemas'].data);
                } else {
                    finalUpdater = processAutorefUnigraphId(finalUpdater);
                }
                const upsert = {...finalUpdater, uid: newUid, 'unigraph.origin': origin};
                //console.log(finalUpdater, upsert)
                const finalUpsert = insertsToUpsert([upsert]);
                //console.log(finalUpsert)
                await client.createUnigraphUpsert(finalUpsert);
                callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches, subIds: subIds})
            } catch (e) {
                console.log(e, uid, newObject)
            }
        },
        deleteRelation: async (uid, relation) => {
            await client.deleteRelationbyJson({uid: uid, ...relation});
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches})
        },
        deleteItemFromArray: async (uid, item, relUid, subIds) => {
            const items = Array.isArray(item) ? item : [item]
            const query = `query { res(func: uid(${uid})) {
                uid
                <_value[> {
                    uid
                    _index { uid <_value.#i> }
                    _value { uid }
                }
            }}`
            const origObject = (await client.queryDgraph(query))[0][0];
            if (!origObject || !(Array.isArray(origObject['_value[']))) {
                throw Error("Cannot delete as source item is not an array!");
            }
            origObject['_value['].sort((a: any, b: any) => (a["_index"]?.["_value.#i"] || 0) - (b["_index"]?.["_value.#i"] || 0));
            const newValues: any[] = [];
            let toDel = "";
            origObject['_value['].forEach((el: any, index: number) => {
                if (!items.includes(index) && !items.includes(el.uid) && !items.includes(el['_value']?.uid)) {
                    newValues.push(`<${el['_index'].uid}> <_value.#i> "${newValues.length.toString()}" .`)
                } else { 
                    if (relUid) toDel += "<" + el['_value'].uid + "> <unigraph.origin> <" +  + relUid + "> .\n";
                    toDel += `<${uid}> <_value[> <${el.uid}> .\n`;
                }
            });
            const delete_array = new dgraph.Mutation();
            delete_array.setDelNquads(toDel)
            const create_json = new dgraph.Mutation();
            create_json.setSetNquads(newValues.join('\n'));
            const result = await client.createDgraphUpsert({
                query: false,
                mutations: [
                    delete_array,
                    create_json
                ]
            });
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches, subIds: subIds})
            return result
        },
        // latertodo
        getReferenceables: async (key = "unigraph.id", asMapWithContent = false) => {return Error('Not implemented')},
        getSchemas: async (schemas: string[] | undefined, resolve = false) => {
            return Object.fromEntries(Object.entries(states.caches['schemas'].data).filter(([k, _]) => !schemas?.length || schemas?.includes(k))) as any;
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
            const ret = await buildExecutable(exec, {"params": params, "definition": exec}, states.localApi)();
            return ret;
        },
        addNotification: async (notification) => {
            await addNotification(notification, states.caches, client);
            //console.log(hooks)
            callHooks(states.hooks, "after_object_changed", {subscriptions: states.subscriptions, caches: states.caches})
        },
        addState: (...params) => {throw Error('Not available in server side')},
        getState: (...params) => {throw Error('Not available in server side')},
        deleteState: (...params) => {throw Error('Not available in server side')},
        getSearchResults: async (query: string, method = "fulltext", display: any) => {
            let res: {results: any[], entities: any[]} = {results: [], entities: []};
            if (method === 'fulltext') res = await client.getTextSearchResults(query, display);
            return res;
        },
        getSecret: (scope, key) => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const keyfile = require(path.join(__dirname, "secrets.env.json"));
            if (keyfile?.[scope]?.[key]) return keyfile[scope][key];
            else return "";
        },
        awaitHttpCallback: (key: string) => {
            return new Promise((resolve, _) => {
                states.httpCallbacks[key] = resolve;
            })
        },
        exportObjects: async (uids, options) => {
            const queries = uids.map(el => `(func: uid(${el})) @recurse {uid unigraph.id expand(_userpredicate_) }`);
            const res: any[] = (await states.localApi.getQueries(queries)).map((el: any[]) => el[0]);
            const entityMap = flatten(res);
            const indexesQueries = Object.keys(entityMap).map(el => `(func: uid(${el})) {unigraph.indexes {expand(_userpredicate_) {uid } }}`);
            const indexesRes = await states.localApi.getQueries(indexesQueries);
            indexesRes.forEach((el: any, idx: number) => {if (el[0]) entityMap[Object.keys(entityMap)[idx]]['unigraph.indexes'] = el[0]['unigraph.indexes'];});
            return unflatten(entityMap, uids);
        },
        callHook: async (name, params) => {
            await callHooks(states.hooks, name, params)
        }
    }
}