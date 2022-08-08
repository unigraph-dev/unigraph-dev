/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

/* eslint-disable default-param-last */
/* eslint-disable max-len */
import { buildGraph, getCircularReplacer, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { Unigraph } from 'unigraph-dev-common/lib/types/unigraph';
import {
    processAutorefUnigraphId,
    makeQueryFragmentFromType,
    clearEmpties,
    buildUnigraphEntity,
    processAutoref,
    flatten,
    unflatten,
    unpad,
    removeUids,
} from 'unigraph-dev-common/lib/utils/entityUtils';
import { insertsToUpsert } from 'unigraph-dev-common/lib/utils/txnWrapper';
import dgraph from 'dgraph-js';
import path from 'path';
import stringify from 'json-stable-stringify';
import { ExecContext } from 'unigraph-dev-common/lib/types/executableTypes';
import { Subscription } from './custom.d';
import DgraphClient, { UnigraphUpsert } from './dgraphClient';
import { buildExecutable } from './executableManager';
import { callHooks } from './hooks';
import { addNotification } from './notifications';
import { createSubscriptionLocal, createSubscriptionWS, getFragment, resolveSubscriptionUpdate } from './subscriptions';
import { Cache, updateClientCache } from './caches';
import { getQueryString } from './search';
import { processQueryTemplate } from './utils';

// eslint-disable-next-line import/prefer-default-export
export function getLocalUnigraphAPI(
    client: DgraphClient,
    states: {
        caches: Record<string, Cache<any>>;
        subscriptions: Subscription[];
        hooks: any;
        namespaceMap: any;
        localApi: Unigraph;
        httpCallbacks: any;
        getClientId: any;
        lock: any;
    },
): Unigraph {
    const messages: any[] = [];
    const eventTarget: any = {};

    const api: Unigraph = {
        backendConnection: { current: undefined },
        backendMessages: messages,
        eventTarget,
        buildGraph,
        // latertodo
        getStatus: () => {
            throw Error('Not implemented');
        },
        createSchema: async (schemain) => {
            const autorefSchema = processAutorefUnigraphId(schemain);
            const upsert: UnigraphUpsert = insertsToUpsert(
                [autorefSchema],
                undefined,
                states.caches.schemas.dataAlt![0],
            );
            await client.createUnigraphUpsert(upsert);
            await states.caches.schemas.updateNow();
            await states.caches.packages.updateNow();
            callHooks(states.hooks, 'after_schema_updated', { caches });
        },
        // latertodo
        ensureSchema: async (name, fallback) => Error('Not implemented'),
        // latertodo
        ensurePackage: async (packageName, fallback) => Error('Not implemented'),
        subscribeToType: async (name, callback: any, eventId = undefined, options: any) =>
            api.subscribe({ type: 'type', name, options }, callback, eventId),
        subscribeToObject: async (uid, callback: any, eventId = undefined, options: any) =>
            api.subscribe({ type: 'object', uid, options }, callback, eventId),
        subscribeToQuery: async (fragment, callback: any, eventId = undefined, options: any) =>
            api.subscribe({ type: 'query', fragment, options }, callback, eventId),
        subscribe: async (query, callback: any, eventId = undefined, update) => {
            eventId = eventId || getRandomInt();
            if (update) {
                const ret = resolveSubscriptionUpdate(eventId, query, states);
                if (ret === false) throw new Error('Not a valid subscription update!');
            } else {
                const newSub =
                    typeof callback === 'function'
                        ? createSubscriptionLocal(eventId, callback, query)
                        : createSubscriptionWS(
                              eventId,
                              callback.ws,
                              query,
                              callback.connId,
                              states.getClientId(callback.connId),
                          );
                states.subscriptions.push(newSub);
                callHooks(states.hooks, 'after_subscription_added', {
                    subscriptions: states.subscriptions,
                    ids: [eventId],
                });
            }
        },
        hibernateOrReviveSubscription: async (eventId = undefined, revival) => {
            const shouldHibernated = !revival;
            let eventIds: any = eventId;
            if (!Array.isArray(eventId)) eventIds = [eventId];
            states.subscriptions = states.subscriptions.map((el) =>
                Object.assign(el, {
                    hibernated: eventIds.includes(el.id) ? shouldHibernated : el.hibernated,
                }),
            );
            if (revival)
                callHooks(states.hooks, 'after_subscription_added', {
                    subscriptions: states.subscriptions,
                    ids: eventIds,
                });
        },
        unsubscribe: async (id) => {
            states.subscriptions = states.subscriptions.reduce((prev: Subscription[], curr: Subscription) => {
                if (curr.id === id) return prev;
                prev.push(curr);
                return prev;
            }, []);
        },
        addObject: async (object, schema, padded, subIds, bulk) => {
            clearEmpties(object);
            // console.log(JSON.stringify(object, null, 4));
            const objects = Array.isArray(object) ? object : [object];
            if (objects.length === 0) return [];
            const finalUnigraphObjects = objects.map((obj, index) => {
                let unigraphObject = obj;
                if (!padded)
                    unigraphObject = buildUnigraphEntity(obj, schema, states.caches.schemas.data, undefined, {
                        globalStates: { nextUid: 100000 * index },
                    } as any);
                return processAutoref(unigraphObject, schema, states.caches.schemas.data);
            });
            // console.log(JSON.stringify(finalUnigraphObject, null, 4));
            const upsert = insertsToUpsert(finalUnigraphObjects, undefined, states.caches.schemas.dataAlt![0]);
            const [uids, changedUids] = await client.createUnigraphUpsert(upsert);
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
                subIds,
                changedUids,
                bulk,
            });
            return uids;
        },
        getNamespaceMapUid: (name) => states.namespaceMap[name].uid,
        getType: async (name) => {
            const eventId = getRandomInt();
            const queryAny =
                'query {entities(func: type(Entity)) @recurse { uid unigraph.id expand(_userpredicate_) }}';
            const query =
                name === 'any'
                    ? queryAny
                    : `query {entities(func: uid(par${eventId})) 
            ${makeQueryFragmentFromType(name, states.caches.schemas.data)}
            par${eventId} as var(func: has(type)) @filter((NOT type(Deleted)) AND type(Entity)) @cascade {
                type @filter(eq(<unigraph.id>, "${name}"))
            }}`;
            const res = await client.queryData(query);
            return res;
        },
        getObject: async (uidOrName: any, options: any) => {
            const frag = `query${getFragment({ type: 'object', uid: uidOrName, options }, states)}`;
            const ret = Array.isArray(uidOrName)
                ? (await client.queryDgraph(`query { ${frag} }`))[0]
                : (await client.queryDgraph(`query { ${frag} }`))[0]?.[0];
            return ret;
        },
        getQueries: async (fragments, getAll = false, batch = 50, commonVars) => {
            let allQueries;
            if (!Array.isArray(fragments)) fragments = [fragments];
            if (getAll) {
                allQueries = fragments.map(
                    (
                        it,
                        index,
                    ) => `query${index}(func: uid(par${index})) @recurse {uid unigraph.id expand(_userpredicate_)}
            par${index} as var${it}`,
                );
            } else allQueries = fragments.map((it, index) => `query${index}${it}`);
            if (!batch) batch = allQueries.length;
            const batchedQueries = allQueries.reduce((resultArray, item, index) => {
                const chunkIndex = Math.floor(index / batch);

                if (!resultArray[chunkIndex]) {
                    resultArray[chunkIndex] = []; // start a new chunk
                }

                resultArray[chunkIndex].push(item);

                return resultArray;
            }, [] as any);
            const res: any[] = [];
            for (let i = 0; i < batchedQueries.length; i += 1) {
                if (commonVars) batchedQueries[i].push(commonVars);
                res.push(
                    // eslint-disable-next-line no-await-in-loop
                    ...(await client.queryDgraph(
                        processQueryTemplate(`query {${batchedQueries[i].join('\n')}}`, states.caches.schemas),
                    )),
                );
            }
            return res;
        },
        deleteObject: async (uid, permanent) => {
            if (!Array.isArray(uid)) uid = [uid];
            const toDel = uid.map((uidi: any) =>
                uidi.startsWith('$/') && states.namespaceMap[uidi] ? states.namespaceMap[uidi].uid : uidi,
            );
            permanent ? await client.deleteUnigraphObjectPermanently(toDel) : await client.deleteUnigraphObject(toDel);
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
            });
        },
        // latertodo
        updateTriplets: async (objects, isDelete, subIds) => {
            if (Array.isArray(objects)) {
                // is triplet
                const updateTriplets = new dgraph.Mutation();
                if (!isDelete) updateTriplets.setSetNquads(objects.join('\n'));
                else updateTriplets.setDelNquads(objects.join('\n'));
                const [result, changedUids] = await client.createDgraphUpsert({
                    query: false,
                    mutations: [updateTriplets],
                });
                callHooks(states.hooks, 'after_object_changed', {
                    subscriptions: states.subscriptions,
                    caches: states.caches,
                    subIds,
                    changedUids,
                });
            }
        },
        updateObject: async (uid, newObject, isUpsert = true, pad = true, subIds, origin) => {
            clearEmpties(newObject);
            const newUid = uid || newObject.uid;
            // Get new object's unigraph.origin first
            // console.log("update: 1")
            if (!origin) {
                origin = newObject['unigraph.origin']
                    ? newObject['unigraph.origin']
                    : (
                          await client.queryData<any>(
                              `query { entity(func: uid(${newUid})) { <unigraph.origin> { uid } }}`,
                              [],
                          )
                      )[0]?.['unigraph.origin'];
                if (!Array.isArray(origin)) origin = [origin];
            }
            // console.log("update: 2", uid)
            const origObject = (await client.queryUID(uid))[0];
            let finalUpdater = newObject;
            // console.log("update: 3", uid)
            try {
                if (pad) {
                    const schema = origObject.type['unigraph.id'];
                    const paddedUpdater = buildUnigraphEntity(newObject, schema, states.caches.schemas.data, true, {
                        validateSchema: true,
                        isUpdate: true,
                        states: {},
                        globalStates: {},
                    });
                    finalUpdater = processAutoref(paddedUpdater, schema, states.caches.schemas.data);
                } else {
                    finalUpdater = processAutorefUnigraphId(finalUpdater);
                }
                const upsert = {
                    ...finalUpdater,
                    uid: newUid,
                    'unigraph.origin': origin,
                };
                // console.log(finalUpdater, upsert)
                const finalUpsert = insertsToUpsert([upsert], isUpsert, states.caches.schemas.dataAlt![0]);
                // console.log(finalUpsert)
                const [uids, changedUids] = await client.createUnigraphUpsert(finalUpsert);
                callHooks(states.hooks, 'after_object_changed', {
                    subscriptions: states.subscriptions,
                    caches: states.caches,
                    subIds,
                    changedUids,
                });
            } catch (e) {
                console.log(e, uid, newObject);
            }
        },
        deleteRelation: async (uid, relation) => {
            await client.deleteRelationbyJson({ uid, ...relation });
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
            });
        },
        reorderItemInArray: async (uid, item, relUid, subIds) => {
            const items: [number | string, number][] = (Array.isArray(item[0]) ? item : [item]) as any;
            const query = `query { res(func: uid(${uid})) {
                uid
                <_value[> {
                    uid
                    _index { uid <_value.#i> }
                    _value { uid 
                        _value { uid }
                    }
                }
            }}`;
            const origObject = (await client.queryDgraph(query))[0][0];
            if (!origObject || !Array.isArray(origObject['_value['])) {
                throw Error('Cannot reorder as source item is not an array!');
            }
            origObject['_value['].sort(
                (a: any, b: any) => (a._index?.['_value.#i'] || 0) - (b._index?.['_value.#i'] || 0),
            );
            // Reorder items
            let newObject = origObject['_value['].map((el) => el._index.uid);
            const permutations: [string, number][] = items
                .map((el) => {
                    const targetIndex = el[1];
                    let source;
                    origObject['_value['].forEach((ell: any, index: number) => {
                        if (
                            el[0] === index ||
                            el[0] === ell.uid ||
                            el[0] === ell._value?.uid ||
                            el[0] === ell._value?._value?.uid
                        ) {
                            source = ell._index.uid;
                        }
                    });
                    return source ? [source, targetIndex] : undefined;
                })
                .filter((el) => el !== undefined) as any;
            permutations.forEach(([source, target]) => {
                let oldIndex = newObject.length;
                const toInsert = newObject.filter((el, index) => {
                    if (el === source) oldIndex = index;
                    return el !== source;
                });
                toInsert.splice(oldIndex < target ? target : target + 1, 0, source);
                newObject = toInsert;
            });
            const quads = newObject.map((el, index) => `<${el}> <_value.#i> "${index}" .\n`);
            const createJson = new dgraph.Mutation();
            createJson.setSetNquads(quads.join(''));
            const [result, changedUids] = await client.createDgraphUpsert({
                query: false,
                mutations: [createJson],
            });

            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
                subIds,
                changedUids,
            });
            return result;
        },
        deleteItemFromArray: async (uid, item, relUid, subIds, runHooks = true) => {
            const items = Array.isArray(item) ? item : [item];
            const query = `query { res(func: uid(${uid})) {
                uid
                <_value[> {
                    uid
                    _index { uid <_value.#i> }
                    _value { uid 
                        _value { uid }
                    }
                }
            }}`;
            const origObject = (await client.queryDgraph(query))[0][0];
            if (!origObject || !Array.isArray(origObject['_value['])) {
                throw Error('Cannot delete as source item is not an array!');
            }
            origObject['_value['].sort(
                (a: any, b: any) => (a._index?.['_value.#i'] || 0) - (b._index?.['_value.#i'] || 0),
            );
            const newValues: any[] = [];
            let toDel = '';
            origObject['_value['].forEach((el: any, index: number) => {
                if (
                    !items.includes(index) &&
                    !items.includes(el.uid) &&
                    !items.includes(el._value?.uid) &&
                    !items.includes(el._value?._value?.uid)
                ) {
                    if (el._index?.uid)
                        newValues.push(`<${el._index.uid}> <_value.#i> "${newValues.length.toString()}" .`);
                } else {
                    if (relUid) {
                        if (el._value?.uid) toDel += `<${el._value.uid}> <unigraph.origin> <${+relUid}> .\n`;
                        if (el?._value?._value?.uid)
                            toDel += `<${el._value._value.uid}> <unigraph.origin> <${+relUid}> .\n`;
                        if (el?._value?._value?._value?.uid)
                            toDel += `<${el._value._value._value.uid}> <unigraph.origin> <${+relUid}> .\n`;
                    }
                    toDel += `<${uid}> <_value[> <${el.uid}> .\n`;
                }
            });
            const deleteArray = new dgraph.Mutation();
            deleteArray.setDelNquads(toDel);
            const createJson = new dgraph.Mutation();
            createJson.setSetNquads(newValues.join('\n'));
            const [result, changedUids] = await client.createDgraphUpsert({
                query: false,
                mutations: [deleteArray, createJson],
            });
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
                subIds,
                changedUids: runHooks ? changedUids : undefined,
            });
            return result;
        },
        // latertodo
        getReferenceables: async (key = 'unigraph.id', asMapWithContent = false) => Error('Not implemented'),
        getSchemas: async (schemas: string[] | undefined, resolve = false) =>
            Object.fromEntries(
                Object.entries(states.caches.schemas.data).filter(([k, _]) => !schemas?.length || schemas?.includes(k)),
            ) as any,
        getPackages: async (packages) => states.caches.packages.data,
        // latertodo
        proxyFetch: async (url, options?) => new Blob([]),
        // latertodo
        importObjects: async (objects) => Error('Not implemented'),
        runExecutable: async (
            uid: string,
            params: any,
            context?: ExecContext,
            fnString?: any,
            bypassCache?: boolean,
        ) => {
            let ret;
            if (!bypassCache)
                await states.lock.acquire('caches/exec', async (done: any) => {
                    done(false, null);
                });
            const exec = uid.startsWith('0x')
                ? unpad((await client.queryUID(uid))[0])
                : states.caches.executables.data[uid];
            if (!exec) {
                console.error('Executable not found!');
                return undefined;
            }
            const execFn = await buildExecutable(
                exec,
                { params, definition: exec, ...context },
                states.localApi,
                states,
            );
            if (typeof execFn === 'function') {
                ret = execFn();
            } else if (typeof execFn === 'string') {
                ret = { return_function_component: execFn };
            } else ret = {};
            return ret;
        },
        addNotification: async (notification) => {
            await addNotification(notification, states.caches, client);
            // console.log(hooks)
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
            });
        },
        addState: (...params) => {
            throw Error('Not available in server side');
        },
        getState: (...params) => {
            throw Error('Not available in server side');
        },
        deleteState: (...params) => {
            throw Error('Not available in server side');
        },
        getSearchResults: async (query, display: any, hops, searchOptions) => {
            // eslint-disable-next-line no-return-await
            if (display === 'name')
                return (await client.getSearchNameResults(query[0].value, searchOptions?.hideHidden)) as any;
            let res: { results: any[]; entities: any[] } = {
                results: [],
                entities: [],
            };
            const finalQuery = getQueryString(query);
            res = await client.getSearchResults(finalQuery, display, hops, searchOptions);
            return res;
        },
        getSecret: (scope, key) => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const keyfile = require(path.join(__dirname, 'secrets.env.json'));
                if (keyfile?.[scope]?.[key]) return keyfile[scope][key];
            } catch (e) {
                console.error(e);
            }
            return '';
        },
        awaitHttpCallback: (key: string) =>
            new Promise((resolve, _) => {
                states.httpCallbacks[key] = resolve;
            }),
        exportObjects: async (uids, options) => {
            const queries = uids.map((el) => `(func: uid(${el})) @recurse {uid unigraph.id expand(_userpredicate_) }`);
            const res: any[] = (await states.localApi.getQueries(queries)).map((el: any[]) => el[0]);
            const entityMap = flatten(res);
            const indexesQueries = Object.keys(entityMap).map(
                (el) => `(func: uid(${el})) {unigraph.indexes {expand(_userpredicate_) {uid } }}`,
            );
            const indexesRes = await states.localApi.getQueries(indexesQueries);
            indexesRes.forEach((el: any, idx: number) => {
                if (el[0]) entityMap[Object.keys(entityMap)[idx]]['unigraph.indexes'] = el[0]['unigraph.indexes'];
            });
            const unflattened = unflatten(entityMap, uids);
            return removeUids(unflattened);
        },
        callHook: async (name, params) => {
            await callHooks(states.hooks, name, params);
        },
        buildUnigraphEntity: (entity, schema, options) => {
            clearEmpties(entity);
            const unigraphObject = buildUnigraphEntity(entity, schema, states.caches.schemas.data, undefined, options);
            return unigraphObject;
        },
        getSubscriptions: () =>
            states?.subscriptions?.map((el) => ({
                data: (el.data || []).map?.((ell: any) => ({
                    uid: ell.uid,
                    type: { 'unigraph.id': ell.type?.['unigraph.id'] },
                })),
                query: el.query,
                subType: el.subType,
                callbackType: el.callbackType,
                id: el.id,
                regTime: el.regTime,
                connId: el.connId,
                clientId: el.clientId,
                hibernated: el.hibernated,
                queryTime: el.queryTime,
            })) || [],
        touch: async (uids) => {
            const totalUids = Array.isArray(uids) ? uids : [];
            const nowDateString = new Date().toISOString();
            const quads = totalUids.map((uid) => `<${uid}> <_updatedAt> "${nowDateString}" .`);
            const updater = new dgraph.Mutation();
            updater.setSetNquads(quads.join('\n'));
            const [result, changedUids] = await client.createDgraphUpsert({
                query: false,
                mutations: [updater],
            });
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: [],
                caches: states.caches,
                changedUids,
            });
            return result;
        },
        recalculateBacklinks: async (fromUids, toUids, depth = 50) => {
            const queries = fromUids.map(
                (el) => `(func: uid(${el})) @recurse(depth: ${depth}) {uid unigraph.id expand(_userpredicate_) }`,
            );
            const res: any[] = (await states.localApi.getQueries(queries)).map((el: any[]) => el[0]);
            const toDel: string[] = [];
            res.forEach((el: any) => {
                const str = JSON.stringify(el);
                toUids.forEach((it) => {
                    if (!str.includes(`"${it}"`)) {
                        toDel.push(`<${it}> <unigraph.origin> <${el.uid}> .`);
                    }
                });
            });
            const updater = new dgraph.Mutation();
            updater.setDelNquads(toDel.join('\n'));
            const [result, changedUids] = await client.createDgraphUpsert({
                query: false,
                mutations: [updater],
            });
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
                changedUids,
            });
            return result;
        },
        addBacklinks: async (fromUids, toUids) => {
            const toAdd: string[] = [];
            fromUids.forEach((el) => {
                toUids.forEach((it) => {
                    toAdd.push(`<${it}> <unigraph.origin> <${el}> .`);
                });
            });
            const updater = new dgraph.Mutation();
            updater.setSetNquads(toAdd.join('\n'));
            const [result, changedUids] = await client.createDgraphUpsert({
                query: false,
                mutations: [updater],
            });
            callHooks(states.hooks, 'after_object_changed', {
                subscriptions: states.subscriptions,
                caches: states.caches,
                changedUids,
            });
            return result;
        },
        startSyncListen: async (resource, key, sendable?: any) => {
            const resUid = resource.startsWith('$/entity/') ? states.namespaceMap[resource]?.uid : resource;
            if (!resUid.startsWith('0x')) throw new Error("Invalid resource uid or name - maybe it doesn't exist?");

            // Get the resource first
            const resObject = (
                await client.queryDgraph(`query {
                res(func: uid(${resUid})) {
                    <_value> {
                        uid
                        <initializer> {
                            <_value> {
                                uid
                            }
                        }
                        <pending_uids> {
                            uid
                            <_value[> @filter(eq(<_key>, "${key}")) {
                                _key
                                uid
                                <_value[> {
                                    <_value> {
                                        uid
                                    }
                                }
                            }
                        }
                    }
                }
            }`)
            )[0][0];
            const thisKey = resObject._value.pending_uids?.['_value[']?.[0]?.uid;
            let pendingUids;
            if (!thisKey) {
                const initialUids = await api.runExecutable(resObject._value.initializer?._value.uid, {} as any);
                pendingUids = initialUids;
                const m = new dgraph.Mutation();
                m.setSetJson({
                    uid: resObject._value.uid,
                    pending_uids: {
                        uid: resObject._value.pending_uids?.uid,
                        '_value[': {
                            _key: key,
                            '_value[': initialUids.map((el: string[]) => ({ _value: { uid: el } })),
                        },
                    },
                });
                await client.createDgraphUpsert({
                    query: false,
                    mutations: [m],
                });
            } else {
                pendingUids = (resObject._value.pending_uids?.['_value[']?.[0]?.['_value['] || []).map(
                    (el: any) => el._value.uid,
                );
            }
            const syncListeners: Record<string, any[]> = (states as any).websocketSyncListeners;
            if (!syncListeners[resUid]) syncListeners[resUid] = [sendable];
            else syncListeners[resUid].push(sendable);
            if (pendingUids.length > 0)
                sendable.send(
                    stringify(
                        {
                            type: 'sync_updated',
                            uid: resUid,
                            result: pendingUids,
                        },
                        { replacer: getCircularReplacer() },
                    ),
                );
        },
        updateSyncResource: async (resource, uids) => {
            const resUid = resource.startsWith('$/entity/') ? states.namespaceMap[resource]?.uid : resource;
            if (!resUid.startsWith('0x')) throw new Error("Invalid resource uid or name - maybe it doesn't exist?");

            (((states as any).websocketSyncListeners as Record<string, any[]>)[resUid] || []).map((el) =>
                el.send(
                    stringify(
                        {
                            type: 'sync_updated',
                            uid: resUid,
                            result: uids,
                        },
                        { replacer: getCircularReplacer() },
                    ),
                ),
            );
            // Get the resource first
            const resObject = (
                await client.queryDgraph(`query {
                res(func: uid(${resUid})) {
                    <_value> {
                        <pending_uids> {
                            <_value[> {
                                uid
                            }
                        }
                    }
                }
            }`)
            )[0][0];
            const allKeysUids = resObject._value.pending_uids?.['_value[']?.map((el: any) => el.uid) || [];
            const allUpdates = allKeysUids.map((uid: string) => ({
                uid,
                '_value[': uids.map((el) => ({ _value: { uid: el } })),
            }));
            const [result, changedUids] = await client.createDgraphUpsert({
                query: false,
                mutations: allUpdates.map((el: any) => {
                    const m = new dgraph.Mutation();
                    m.setSetJson(el);
                    return m;
                }),
            });
            return result;
        },
        acknowledgeSync: async (resource, key, uids) => {
            const resUid = resource.startsWith('$/entity/') ? states.namespaceMap[resource]?.uid : resource;
            if (!resUid.startsWith('0x')) throw new Error("Invalid resource uid or name - maybe it doesn't exist?");

            // Get the resource first
            const resWithKey = (
                await client.queryDgraph(`query {
                res(func: uid(${resUid})) {
                    <_value> {
                        <pending_uids> {
                            <_value[> @filter(eq(<_key>, "${key}")) {
                                uid
                            }
                        }
                    }
                }
            }`)
            )[0][0];
            const resKeyUid = resWithKey?._value?.pending_uids?.['_value[']?.[0]?.uid;
            if (!resKeyUid) throw new Error('Invalid sync key - no changes made');
            const deleter = (api.deleteItemFromArray as any)(resKeyUid, uids, resUid, [], false);
            return deleter;
        },
        updateClientCache(key: string, newValue: any) {
            return updateClientCache(states, key, newValue);
        },
    };

    return api;
}
