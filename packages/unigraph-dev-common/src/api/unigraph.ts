/* eslint-disable default-param-last */

// FIXME: This file is ambiguous in purpose! Move utils to utils folder and keep this a small interface with a window object.

import _ from 'lodash';
import React from 'react';
import { PackageDeclaration } from '../types/packages';
import { Unigraph, AppState, UnigraphObject as IUnigraphObject } from '../types/unigraph';
import {
    assignUids,
    augmentStubs,
    base64ToBlob,
    buildGraph,
    findUid,
    getCircularReplacer,
    isJsonString,
} from '../utils/utils';

const RETRY_CONNECTION_INTERVAL = 5000;

function getPath(obj: any, path: string | string[]): any {
    if (path.length === 0) return new UnigraphObject(obj);
    if (!Array.isArray(path)) path = path.split('/').filter((e) => e.length);
    const values = Object.keys(obj).filter((el) => el.startsWith('_value'));
    if (values.length > 1) {
        throw new TypeError('Object should have one value only');
    } else if (values.length === 1) {
        return getPath(obj[values[0]], path);
    } else if (Object.keys(obj).includes(path[0])) {
        return getPath(obj[path[0]], path.slice(1));
    } else {
        return undefined;
        // throw new RangeError('Requested path doesn\'t exist')
    }
}

function getObjectAsRecursivePrimitive(object: any) {
    let targetValue: any;
    Object.keys(object).forEach((el) => {
        if (el.startsWith('_value.')) {
            targetValue = object[el];
        } else if (el.startsWith('_value') && typeof object[el] === 'object') {
            const subObj = getObjectAsRecursivePrimitive(object[el]);
            if (subObj || subObj === '' || subObj === 0 || subObj === false) targetValue = subObj;
        }
    });
    return targetValue;
}

export const getObjectAs = (object: any, type: 'primitive') => {
    if (type === 'primitive') {
        return getObjectAsRecursivePrimitive(object);
    }
    return object;
};

/**
 * Merges a single source object to a target object.
 *
 * NOTE: this function mutates the target object.
 *
 * @param target
 * @param source
 */
export const deepMerge = (target: any, source: any) => {
    const recurse = (targ: any, src: any) => {
        if (_.isArray(targ) && !_.isArray(src)) {
            src = [src];
        } else if (!_.isArray(targ) && _.isArray(src)) {
            targ = [targ];
        }

        if (_.isArray(targ) && _.isArray(src)) {
            const uids: string[] = [];
            const [[primObj, objObj], [primSrc, objSrc]] = [targ, src].map((arr) => {
                const objs: any[] = [];
                const prims: any[] = [];
                arr.forEach((el) => {
                    if (typeof el?.uid === 'string') {
                        objs.push(el);
                        uids.push(el.uid);
                    } else prims.push(el);
                });
                return [prims, objs];
            });
            const finPrims = _.uniq(primObj.concat(primSrc));
            const finObjs: any[] = [];
            _.uniq(uids).forEach((uid) => {
                const obj = objObj.find((el) => el.uid === uid);
                const srcc = objSrc.find((el) => el.uid === uid);
                if (obj && srcc) finObjs.push(recurse(obj, srcc));
                else if (obj) finObjs.push(obj);
                else if (srcc) finObjs.push(srcc);
            });
            return [...finPrims, ...finObjs];
        }

        if (targ?.uid && src?.uid && targ.uid !== src.uid) {
            return src;
        }

        if (typeof src === 'undefined' || src === null) return targ;
        if (typeof targ === 'undefined' || targ === null) return src;

        // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
        for (const key of Object.keys(src)) {
            if (src[key] instanceof Object) Object.assign(src[key], recurse(targ[key], src[key]));
        }

        // Join `target` and modified `source`
        return Object.assign(targ || {}, src);
    };

    return recurse(target, source);
};

// TODO: Switch to prototype-based, faster helper functions
// TODO: Benchmark these helper functions
export class UnigraphObject extends Object {
    constructor(obj: any) {
        super(obj);
        Object.setPrototypeOf(this, UnigraphObject.prototype);
    }

    get = (path: string | string[]) => {
        try {
            return getPath(this, path);
        } catch (e) {
            console.error(e);
            console.log(this);
            return e;
        }
    };

    // eslint-disable-next-line class-methods-use-this
    getMetadata = () => undefined;

    getType = () => (this as any).type['unigraph.id'];

    getRefType = () => ((this as any)['dgraph.type'] ? 'ref' : 'value');

    as = (type: string) => getObjectAs(this, type as any);
}

export function getRandomInt() {
    return Math.floor(Math.random() * Math.floor(1000000));
}

export default function unigraph(url: string, browserId: string): Unigraph<WebSocket | undefined> {
    const connection: { current: WebSocket | undefined } = {
        current: undefined,
    };
    const messages: any[] = [];
    const exhaustedLeases: string[] = [];
    const eventTarget: EventTarget = new EventTarget();
    // eslint-disable-next-line @typescript-eslint/ban-types
    const callbacks: Record<string, Function> = {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    const subscriptions: Record<string, Function> = {};
    const subResults: Record<string, any> = {};
    const subFakeUpdates: Record<string, any[]> = {};
    const states: Record<string, AppState> = {};
    const caches: Record<string, any> = {
        namespaceMap: isJsonString(window.localStorage.getItem('caches/namespaceMap'))
            ? // @ts-expect-error: already checked if not JSON
              JSON.parse(window.localStorage.getItem('caches/namespaceMap'))
            : false,
    };
    const cacheCallbacks: Record<string, any[]> = {};
    let retries: any = false;
    let readyCallback = () => undefined;
    const msgQueue: string[] = [];

    const getState = (name: string) => {
        if (name && states[name]) {
            return states[name];
        }
        if (!name) {
            return states;
        }
        return api.addState(name, undefined);
    };

    const addState = (name: string, initialValue: any) => {
        if (!states[name]) {
            const state: AppState = {
                value: initialValue,
                subscribers: [],
                subscribe: (subscriber: (newValue: any) => any) => state.subscribers.push(subscriber),
                unsubscribe: (cb: (newValue: any) => any) => {
                    state.subscribers = state.subscribers.filter((el) => el !== cb);
                },
                setValue: undefined as any,
            };
            state.setValue = (newValue: any, flush?: boolean) => {
                const changed = newValue !== state.value;
                state.value = newValue;
                if (changed || flush) state.subscribers.forEach((sub) => sub(state.value));
            };
            states[name] = state;
            return state;
        }
        return states[name];
    };

    function connect() {
        const urlString = new URL(url);
        urlString.searchParams.append('browserId', browserId);
        const isRevival = getState('unigraph/connected').value !== undefined;
        if (getState('unigraph/connected').value !== undefined) urlString.searchParams.append('revival', 'true');
        if (connection.current?.readyState !== 3 /* CLOSED */ && connection.current) return;
        connection.current = new WebSocket(urlString.toString());

        connection.current.onopen = () => {
            getState('unigraph/connected').setValue(true);
            if (retries) clearInterval(retries);
            if (!isRevival && readyCallback) readyCallback();
            msgQueue.forEach((el) => connection.current?.send(el));
            msgQueue.length = 0;
        };
        connection.current.onclose = () => {
            getState('unigraph/connected').setValue(false);
            retries = setInterval(() => {
                connect();
            }, RETRY_CONNECTION_INTERVAL);
        };

        connection.current.onmessage = (ev) => {
            let parsed: any;
            try {
                parsed = JSON.parse(ev.data);
            } catch (e) {
                console.error('Returned non-JSON reply!');
                console.log(e);
                console.log(ev.data);
                return false;
            }
            // messages.push(parsed);
            eventTarget.dispatchEvent(new Event('onmessage', parsed));
            if (parsed.type === 'response' && parsed.id && callbacks[parsed.id]) callbacks[parsed.id](parsed);
            if (parsed.type === 'cache_updated' && parsed.name) {
                if (parsed.name !== 'uid_lease') {
                    caches[parsed.name] = parsed.result;
                    window.localStorage.setItem(`caches/${parsed.name}`, JSON.stringify(parsed.result));
                } else {
                    const finalLeaseResult = _.difference(parsed.result, exhaustedLeases);
                    caches[parsed.name] = finalLeaseResult;
                }
                cacheCallbacks[parsed.name]?.forEach((el) => el(parsed.result));
            }
            if (parsed.type === 'subscription' && parsed.id && subscriptions[parsed.id] && parsed.result) {
                if (
                    Array.isArray(subFakeUpdates[parsed.id]) &&
                    (subFakeUpdates[parsed.id].includes(parsed.ofUpdate) || subFakeUpdates[parsed.id].length > 0) &&
                    subFakeUpdates[parsed.id].lastIndexOf(parsed.ofUpdate) < subFakeUpdates[parsed.id].length - 1
                ) {
                    return ev;
                }
                subFakeUpdates[parsed.id] = [];
                subResults[parsed.id] = JSON.parse(JSON.stringify(parsed.result));
                subscriptions[parsed.id](parsed.result);
            }
            if (parsed.type === 'open_url' && window) window.open(parsed.url, '_blank');
            return ev;
        };
    }

    addState('unigraph/connected', undefined);

    connect();

    function sendEvent(conn: { current: WebSocket | undefined }, name: string, params: any, id?: number | undefined) {
        if ((window as any).onEventSend) (window as any).onEventSend(name);
        if (!id) id = getRandomInt();
        const msg = JSON.stringify({
            type: 'event',
            event: name,
            id,
            ...params,
        });
        if (getState('unigraph/connected').value === true && conn.current) conn.current.send(msg);
        else {
            msgQueue.push(msg);
            connect();
        }
    }

    const api: Unigraph<WebSocket | undefined> = {
        getState,
        addState,
        deleteState: (name) => delete states[name],
        backendConnection: connection,
        backendMessages: messages,
        eventTarget,
        buildGraph,
        onReady: (callback: any) => {
            readyCallback = callback;
        },
        getStatus: () =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(response);
                    else reject(response);
                };
                sendEvent(connection, 'get_status', {}, id);
            }),
        onCacheUpdated: (cache, callback) => {
            if (Array.isArray(cacheCallbacks[cache])) {
                cacheCallbacks[cache].push(callback);
            } else cacheCallbacks[cache] = [callback];
        },
        createSchema: (schema) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(response);
                    else reject(response);
                };
                sendEvent(connection, 'create_unigraph_schema', { schema }, id);
            }),
        ensureSchema: (name, fallback) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(response);
                    else reject(response);
                };
                sendEvent(connection, 'ensure_unigraph_schema', { name, fallback }, id);
            }),
        ensurePackage: (packageName, fallback) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(response);
                    else reject(response);
                };
                sendEvent(connection, 'ensure_unigraph_package', { packageName, fallback }, id);
            }),
        subscribeToType: (name, callback, eventId = undefined, options: any) =>
            new Promise((resolve, reject) => {
                const id = typeof eventId === 'number' ? eventId : getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(id);
                    else reject(response);
                };
                subscriptions[id] = (result: any[]) => {
                    callback(buildGraph(result.map((el: any) => new UnigraphObject(el)) as any));
                };
                sendEvent(connection, 'subscribe_to_type', { schema: name, options }, id);
            }),
        // eslint-disable-next-line no-async-promise-executor
        subscribeToObject: (uid, callback, eventId = undefined, options: any) =>
            new Promise((resolve, reject) => {
                const id = typeof eventId === 'number' ? eventId : getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(id);
                    else reject(response);
                };
                subscriptions[id] = (result: any) =>
                    result.length === 1
                        ? callback(new UnigraphObject(result[0]))
                        : callback(result.map((el: any) => new UnigraphObject(el)));
                if (typeof options?.queryFn === 'function') options.queryFn = options.queryFn('QUERYFN_TEMPLATE');
                sendEvent(connection, 'subscribe_to_object', { uid, options }, id);
            }),
        subscribeToQuery: (fragment, callback, eventId = undefined, options) =>
            new Promise((resolve, reject) => {
                const id = typeof eventId === 'number' ? eventId : getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(id);
                    else reject(response);
                };
                subscriptions[id] = (result: any[]) => callback(result.map((el: any) => new UnigraphObject(el)));
                sendEvent(connection, 'subscribe_to_query', { queryFragment: fragment, options }, id);
            }),
        subscribe: (query, callback, eventId = undefined, update) =>
            new Promise((resolve, reject) => {
                const id = typeof eventId === 'number' ? eventId : getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(id);
                    else reject(response);
                };
                if (!update) {
                    subscriptions[id] = (result: any[] | any) => {
                        callback(
                            Array.isArray(result)
                                ? result.map((el: any) => new UnigraphObject(el))
                                : new UnigraphObject(result),
                        );
                    };
                }
                sendEvent(connection, 'subscribe', { query, update }, id);
            }),
        hibernateOrReviveSubscription: (eventId = undefined, revival) =>
            new Promise((resolve, reject) => {
                const id = typeof eventId === 'number' ? eventId : getRandomInt();
                sendEvent(connection, 'hibernate_or_revive_subscription', { revival, ids: eventId }, id);
            }),
        unsubscribe: (id) => {
            sendEvent(connection, 'unsubscribe_by_id', {}, id);
            delete subscriptions[id];
            delete subResults[id];
        },
        addObject: (object, schema) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'create_unigraph_object', {
                    object,
                    schema,
                    id,
                });
            }),
        deleteObject: (uid, permanent?) => {
            sendEvent(connection, 'delete_unigraph_object', { uid, permanent });
        },
        updateTriplets: (objects) => {
            // TODO: This is very useless, should be removed once we get something better
            sendEvent(connection, 'update_spo', { objects });
        },
        updateObject: (uid, newObject, upsert = true, pad = true, subIds, origin, eagarlyUpdate) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(id);
                    else reject(response);
                };
                let usedUids: any;
                if (!upsert && !pad && subIds && (!Array.isArray(subIds) || subIds.length === 1) && eagarlyUpdate) {
                    // for simple queries like this, we can just merge and return to interactivity prematurely
                    const subId = Array.isArray(subIds) ? subIds[0] : subIds;
                    if (subscriptions[subId]) {
                        // Assign UIDs to the updated object
                        usedUids = [];
                        if (!newObject.uid) newObject.uid = uid;
                        assignUids(newObject, caches.uid_lease, usedUids, {});
                        exhaustedLeases.push(...usedUids);

                        // Merge updater object with existing one
                        const newObj = JSON.parse(JSON.stringify(subResults[subId], getCircularReplacer()));
                        const [changeLoc] = findUid(newObj, uid);
                        deepMerge(changeLoc, JSON.parse(JSON.stringify(newObject)));
                        augmentStubs(changeLoc, subResults[subId]);
                        subResults[subId] = newObj;
                        setTimeout(() => {
                            // console.log(newObj);
                            subscriptions[subId](newObj);
                        }, 0);

                        // Record state changes
                        if (subFakeUpdates[subId] === undefined) subFakeUpdates[subId] = [id];
                        else subFakeUpdates[subId].push(id);
                    }
                }
                sendEvent(connection, 'update_object', { uid, newObject, upsert, pad, id, subIds, origin, usedUids });
            }),
        deleteRelation: (uid, relation) => {
            sendEvent(connection, 'delete_relation', { uid, relation });
        },
        reorderItemInArray: (uid, item, relUid, subIds) => {
            sendEvent(connection, 'reorder_item_in_array', {
                uid,
                item,
                relUid,
                subIds,
            });
        },
        deleteItemFromArray: (uid, item, relUid, subIds) => {
            sendEvent(connection, 'delete_item_from_array', {
                uid,
                item,
                relUid,
                subIds,
            });
        },
        getReferenceables: (key = 'unigraph.id', asMapWithContent = false) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success)
                        resolve(response.result.map((obj: { [x: string]: any }) => obj['unigraph.id']));
                    else reject(response);
                };
                sendEvent(
                    connection,
                    'query_by_string_with_vars',
                    {
                        vars: {},
                        query: `{
                    q(func: has(unigraph.id)) {
                        unigraph.id
                    }
                }`,
                    },
                    id,
                );
            }),
        getSchemas: (schemas: string[] | undefined, resolve = false) =>
            new Promise((resolver, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.schemas) resolver(response.schemas);
                    else reject(response);
                };
                sendEvent(
                    connection,
                    'get_schemas',
                    {
                        schemas,
                        resolve,
                    },
                    id,
                );
            }),
        getPackages: (packages) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.packages) resolve(response.packages);
                    else reject(response);
                };
                sendEvent(
                    connection,
                    'get_packages',
                    {
                        packages: [],
                    },
                    id,
                );
            }),
        /**
         * Proxifies a fetch request through the server process. This is to ensure a similar experience
         * as using a browser (and NOT using an webapp).
         *
         * Accepts exactly parameters of fetch. Returns a promise containing the blob content
         * (you can use blobToJson to convert to JSON if that's what's returned)
         *
         * @param fetchUrl
         * @param options
         */
        proxyFetch: (fetchUrl, options?) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (responseBlob: { success: boolean; blob: string }) => {
                    if (responseBlob.success && responseBlob.blob) resolve(base64ToBlob(responseBlob.blob));
                    else reject(responseBlob);
                };
                sendEvent(
                    connection,
                    'proxy_fetch',
                    {
                        fetchUrl,
                        options,
                    },
                    id,
                );
            }),
        importObjects: (objects) =>
            new Promise((resolve, reject) => {
                if (typeof objects !== 'string') objects = JSON.stringify(objects);
                const id = getRandomInt();
                sendEvent(connection, 'import_objects', { objects }, id);
            }),
        runExecutable: (uid, params?, context?, fnString?, bypassCache?) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) {
                        if (response.returns?.return_function_component !== undefined && !fnString) {
                            // eslint-disable-next-line no-new-func
                            const retFn = new Function(
                                'React',
                                `return ${response.returns?.return_function_component}`,
                            )(React);
                            console.log(retFn);
                            resolve(retFn);
                        } else {
                            resolve(response.returns ? response.returns : {});
                        }
                    } else reject(response);
                };
                sendEvent(connection, 'run_executable', { uid, params: params || {}, bypassCache }, id);
            }),
        getNamespaceMapUid: (name) => {
            throw Error('Not implemented');
        },
        getNamespaceMap: () => caches.namespaceMap,
        getType: (name) => {
            throw Error('Not implemented');
        },
        getQueries: (queries: any[]) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(response.results ? response.results : {});
                    else reject(response);
                };
                sendEvent(connection, 'get_queries', { fragments: queries }, id);
            }),
        addNotification: (item) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.schemas) resolve(response.schemas);
                    else reject(response);
                };
                sendEvent(connection, 'add_notification', { item }, id);
            }),
        getSearchResults: (query, display, hops, searchOptions) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(
                    connection,
                    'get_search_results',
                    {
                        query,
                        display,
                        hops,
                        searchOptions,
                    },
                    id,
                );
            }),
        getSchemaMap: () => caches.schemaMap,
        exportObjects: (uids, options) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.result) resolve(response.result);
                    else reject(response);
                };
                sendEvent(connection, 'export_objects', { uids, options }, id);
            }),
        addPackage: (manifest, update = false) => {
            sendEvent(connection, 'add_unigraph_package', {
                package: manifest,
                update,
            });
        },
        getSubscriptions: () =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.result) resolve(response.result);
                    else reject(response);
                };
                sendEvent(connection, 'get_subscriptions', {}, id);
            }),
        touch: (uids) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.result) resolve(response.result);
                    else reject(response);
                };
                sendEvent(connection, 'touch', { uids }, id);
            }),
        leaseUid: () => {
            const leased = caches.uid_lease.shift();
            sendEvent(connection, 'lease_uid', { uid: leased });
            return leased;
        },
    };

    return api;
}

export function getExecutableId(pkg: PackageDeclaration, name: string) {
    return `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/executable/${name}`;
}
