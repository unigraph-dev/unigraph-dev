/* eslint-disable camelcase */
/* eslint-disable default-param-last */

// FIXME: This file is ambiguous in purpose! Move utils to utils folder and keep this a small interface with a window object.

import _ from 'lodash/fp';
import React from 'react';
import { ValidationError } from 'schema-utils';
import { PackageDeclaration } from '../types/packages';
import { Unigraph, AppState, UnigraphObject as IUnigraphObject, UnigraphExecutable } from '../types/unigraph';
import { buildExecutableForClient } from '../utils/executableUtils';
import { Executable } from '../types/executableTypes';
import {
    assignUids,
    augmentStubs,
    base64ToBlob,
    buildGraph,
    findAllUids,
    findUid,
    getCircularReplacer,
    isJsonString,
    mergeObjectWithUpdater,
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

function getObjectAsRecursiveType(object: any, type: string) {
    let targetValue: any;
    if (object.type?.['unigraph.id'] === type) {
        targetValue = object;
    }
    Object.keys(object).forEach((el: any) => {
        if (el.type?.['unigraph.id'] === type) {
            targetValue = object[el];
        } else if (el.startsWith('_value') && typeof object[el] === 'object') {
            const subObj = getObjectAsRecursiveType(object[el], type);
            if (subObj || subObj === '' || subObj === 0 || subObj === false) targetValue = subObj;
        }
    });
    return targetValue;
}

export const getObjectAs = (object: any, type: 'primitive' | 'values' | string) => {
    if (type === 'primitive') {
        return getObjectAsRecursivePrimitive(object);
    }
    if (type === 'values' && object?.['_value[']) {
        return object['_value['].map((el: any) => el._value);
    }
    if (type?.startsWith('$/schema/')) {
        return getObjectAsRecursiveType(object, type);
    }
    return object;
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

export default function unigraph(url: string, browserId: string, password?: string): Unigraph<WebSocket | undefined> {
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
    const subsTxn: Record<string, any> = {};
    const states: Record<string, AppState> = {};
    const caches: Record<string, any> = {
        namespaceMap: isJsonString(window.localStorage.getItem('caches/namespaceMap'))
            ? // @ts-expect-error: already checked if not JSON
              buildGraph([JSON.parse(window.localStorage.getItem('caches/namespaceMap'))])[0]
            : false,
    };
    const cacheCallbacks: Record<string, any[]> = {};
    let retries: any = false;
    let readyCallback = () => undefined;
    const msgQueue: string[] = [];
    let api: Unigraph<WebSocket | undefined>;

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
                subscribe: (subscriber: (newValue: any) => any, initial?) => {
                    state.subscribers.push(subscriber);
                    if (initial) subscriber(state.value);
                },
                unsubscribe: (cb: (newValue: any) => any) => {
                    state.subscribers = state.subscribers.filter((el) => el !== cb);
                },
                setValue: undefined as any,
            };
            state.setValue = (newValue: any, flush?: boolean) => {
                if (typeof newValue === 'function') newValue = newValue(state.value);
                const changed = newValue !== state.value;
                state.value = newValue;
                if (changed || flush) state.subscribers.forEach((sub) => sub(state.value));
            };
            states[name] = state;
            return state;
        }
        return states[name];
    };

    const runExecutableInServer = <T>(
        uid: string,
        params: T,
        context?: any,
        fnString?: boolean,
        bypassCache?: boolean,
        streamed?: any,
    ) =>
        new Promise((resolve, reject) => {
            const id = getRandomInt();
            let streamed_id: any;
            if (streamed) {
                streamed_id = getRandomInt();
                callbacks[streamed_id] = (response: any) => {
                    if (response.body) {
                        streamed(response.body);
                    }
                };
            }
            callbacks[id] = (response: any) => {
                if (response.success) {
                    if (response.returns?.return_function_component !== undefined && !fnString) {
                        // eslint-disable-next-line no-new-func
                        const retFn = new Function('React', `return ${response.returns?.return_function_component}`)(
                            React,
                        );
                        console.log(retFn);
                        resolve(retFn);
                    } else {
                        resolve(response.returns ? response.returns : {});
                    }
                } else reject(response);
            };
            sendEvent(
                connection,
                'run_executable',
                { uid, params: params || {}, bypassCache, context, ...(streamed_id ? { streamed_id } : {}) },
                id,
            );
        });

    const runExecutableInClient = <T>(
        exec: Executable,
        params: T,
        context?: any,
        fnString?: boolean,
        bypassCache?: boolean,
    ) => {
        let ret;
        // if (!bypassCache)
        //     await states.lock.acquire('caches/exec', async (done: any) => {
        //         done(false, null);
        //     });
        // const exec = uid.startsWith('0x')
        //     ? unpad((await client.queryUID(uid))[0])
        //     : states.caches.executables.data[uid];
        // if (!exec) {
        //     console.error('Executable not found!');
        //     return undefined;
        // }
        const execFn = buildExecutableForClient(exec, { params, definition: exec, ...context }, api, states);
        if (typeof execFn === 'function') {
            ret = execFn();
        } else if (typeof execFn === 'string') {
            ret = { return_function_component: execFn };
        } else ret = {};
        console.log('runExecutable', { exec, ret, execFn });
        return ret;
    };

    const runExecutable = <T>(uidOrExec: any, params: T, context?: any, fnString?: boolean) => {
        // Routs through backend if passed a uid, tries to run in client otherwise (should be passed a Unigraph Object of an Executable)
        if (typeof uidOrExec === 'string') {
            return runExecutableInServer(uidOrExec, params, context, fnString);
        }
        // client only runs client and lambda execs
        return runExecutableInClient(uidOrExec, params, context, fnString);
    };

    const runExecutableStreamed = <T>(uidOrExec: any, params: T, callback: any) => {
        return runExecutableInServer(uidOrExec, params, undefined, undefined, undefined, callback);
    };

    const dispatchCommand = (name: string, params: any, context: any) => {
        // finds a command in the registry,
        // picks the right handler whose condition returns true,
        // and calls its action

        // finds right command
        const allCommands: any[] = states['registry/uiCommands'].value;
        const allCommandHandlers: any[] = states['registry/uiCommandHandlers'].value;
        const commands = allCommands.filter(_.propEq('unigraph.id', name));
        // test name: "$/package/unigraph.ui_commands/0.2.5/entity/close_tab_command"
        if (commands.length === 0) {
            console.error('No commands registered');
            return;
        }
        const command = commands[0];

        // finds right handler
        const handlers = allCommandHandlers
            .filter((handler: any) => handler.get('command')._value['unigraph.id'] === name)
            .map(_.prop('_value'));

        const validateHandler = (handler: any) => {
            // TODO uncomment when lambdas (like the condition) return stuff
            return runExecutable(handler.condition._value._value, {});
            // return true;
        };

        const validHandlers = handlers.filter(validateHandler);

        if (validHandlers.length === 0) {
            console.error('No handlers found');
            return;
        }

        const pickValidHandler = _.last;
        const handler = pickValidHandler(validHandlers);

        // runs action for handler
        runExecutable(handler.action._value._value, params, context);

        console.log('dispatchedCommand', {
            name,
            params,
            context,
            allCommands,
            allCommandHandlers,
            command,
            handlers,
            validHandlers,
            handler,
        });
    };

    function connect() {
        const urlString = new URL(url);
        urlString.searchParams.append('browserId', browserId);
        urlString.searchParams.append('password', password || '');
        const isRevival = getState('unigraph/connected').value !== undefined;
        if (getState('unigraph/connected').value !== undefined) urlString.searchParams.append('revival', 'true');
        if (connection.current?.readyState !== 3 /* CLOSED */ && connection.current) return;
        connection.current = new WebSocket(urlString.toString());

        connection.current.onopen = () => {
            getState('unauthorized').setValue(undefined);
            if (retries) clearInterval(retries);
            if (!isRevival && readyCallback) readyCallback();
            msgQueue.forEach((el) => connection.current?.send(el));
            msgQueue.length = 0;
        };
        connection.current.onclose = (event) => {
            console.log(event);
            getState('unigraph/connected').setValue(false);
            if (event.code === 4004) {
                // closing because unauthorized, should prompt
                getState('unauthorized').setValue(JSON.parse(event.reason));
            } else {
                retries = setInterval(() => {
                    connect();
                }, RETRY_CONNECTION_INTERVAL);
            }

            // remove uid leases since they are no longer valid at server
            caches.uid_lease = [];
            exhaustedLeases.splice(0, exhaustedLeases.length);
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
            if (parsed.type === 'hello') {
                getState('unigraph/recovery').setValue(!!parsed.recovery);
                getState('unigraph/connected').setValue(true);
            }
            eventTarget.dispatchEvent(new Event('onmessage', parsed));
            if (parsed.type === 'response' && parsed.id && callbacks[parsed.id]) callbacks[parsed.id](parsed);
            if (parsed.type === 'cache_updated' && parsed.name) {
                if (parsed.name !== 'uid_lease') {
                    buildGraph([parsed.result]);
                    caches[parsed.name] = parsed.result;
                    window.localStorage.setItem(
                        `caches/${parsed.name}`,
                        JSON.stringify(parsed.result, getCircularReplacer()),
                    );
                } else {
                    const finalLeaseResult = _.difference(parsed.result, exhaustedLeases);
                    caches[parsed.name] = finalLeaseResult;
                }
                cacheCallbacks[parsed.name]?.forEach((el) => el(parsed.result));
            }
            if (parsed.type === 'subscription' && parsed.id && subscriptions[parsed.id] && parsed.result) {
                if (subsTxn[parsed.id] && parsed.txn < subsTxn[parsed.id]) {
                    return ev;
                }
                if (
                    Array.isArray(subFakeUpdates[parsed.id]) &&
                    (subFakeUpdates[parsed.id].includes(parsed.ofUpdate) || subFakeUpdates[parsed.id].length > 0) &&
                    subFakeUpdates[parsed.id].lastIndexOf(parsed.ofUpdate) < subFakeUpdates[parsed.id].length - 1
                ) {
                    return ev;
                }

                subsTxn[parsed.id] = parsed.txn || 999999999999;

                // Now we can safely update the state
                subFakeUpdates[parsed.id] = [];
                subResults[parsed.id] = JSON.parse(JSON.stringify(parsed.result));
                if (parsed.supplementary) {
                    buildGraph(
                        _.uniqBy('uid', [...parsed.result, ...parsed.supplementary]),
                        true,
                        parsed.result.length,
                    );
                }
                subscriptions[parsed.id](parsed.result, parsed.supplementary !== undefined);
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
        if (
            getState('unigraph/connected').value === true &&
            addState('unigraph/recovery', null).value !== null &&
            conn.current
        )
            conn.current.send(msg);
        else {
            msgQueue.push(msg);
            connect();
        }
    }

    api = {
        getState,
        addState,
        deleteState: (name) => delete states[name],
        getStateMap: () => states,
        dispatchCommand,
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
        onCacheUpdated: (cache, callback, currentCache) => {
            if (Array.isArray(cacheCallbacks[cache])) {
                cacheCallbacks[cache].push(callback);
            } else cacheCallbacks[cache] = [callback];
            if (currentCache) callback(caches[cache]);
        },
        getCache: (cache) => caches[cache],
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
                subscriptions[id] = (result: any[], skipBuild?: boolean) => {
                    const fn = skipBuild ? _.identity : buildGraph;
                    callback((fn as any)(result.map((el: any) => new UnigraphObject(el)) as any));
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
                subscriptions[id] = (result: any, skipBuild?: boolean) => {
                    const fn = skipBuild ? buildGraph : buildGraph;
                    result.length === 1
                        ? callback((fn as any)(result.map((el: any) => new UnigraphObject(el) as any))[0])
                        : callback((fn as any)(result.map((el: any) => new UnigraphObject(el) as any)));
                };
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
                subscriptions[id] = (result: any[], skipBuild?: boolean) => {
                    const fn = skipBuild || options?.skipBuild === true ? _.identity : buildGraph;
                    callback((fn as any)(result.map((el: any) => new UnigraphObject(el) as any)));
                };
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
                    subscriptions[id] = (result: any[] | any, skipBuild?: boolean) => {
                        const fn = skipBuild ? _.identity : buildGraph;
                        callback(
                            Array.isArray(result)
                                ? fn(result.map((el: any) => new UnigraphObject(el) as any))
                                : (fn as any)([result].map((el: any) => new UnigraphObject(el) as any))[0],
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
        getObject: (uidOrName, options) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    // console.log('getObject', response);
                    if (response.success) resolve(buildGraph(response.results));
                    else reject(response);
                };
                sendEvent(connection, 'get_object', { uidOrName, options, id });
            }),
        addObject: (object, schema, padding?: any, subIds?: any, id?: any, bulk?: any) =>
            new Promise((resolve, reject) => {
                id = id || getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'create_unigraph_object', {
                    object,
                    schema,
                    id,
                    padding,
                    subIds,
                    bulk,
                });
            }),
        deleteObject: (uid, permanent?) => {
            sendEvent(connection, 'delete_unigraph_object', { uid, permanent });
        },
        updateTriplets: (objects, isDelete, subIds) => {
            // TODO: This is very useless, should be removed once we get something better
            sendEvent(connection, 'update_spo', { objects, isDelete, subIds });
        },
        updateObject: (uid, newObject, upsert = true, pad = true, subIds, origin, eagarlyUpdate, thisEventId: any) =>
            new Promise((resolve, reject) => {
                const id = thisEventId || getRandomInt();
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

                        api.sendFakeUpdate?.(subId, newObject, id);
                    }
                }
                if (!Array.isArray(subIds) || subIds.length === 1) {
                    const subId = Array.isArray(subIds) ? subIds[0] : subIds;
                    if (subFakeUpdates[subId] === undefined) subFakeUpdates[subId] = [id];
                    else subFakeUpdates[subId].push(id);
                }
                sendEvent(connection, 'update_object', { uid, newObject, upsert, pad, id, subIds, origin, usedUids });
            }),
        sendFakeUpdate: (subId, updater, eventId, fullObject?) => {
            // Merge updater object with existing one
            // console.log('subId0', JSON.parse(JSON.stringify(subResults[subId], getCircularReplacer())));
            const id = eventId;
            let newObj: any;
            if (fullObject) {
                newObj = updater;
            } else {
                newObj = mergeObjectWithUpdater(subResults[subId], updater);
            }

            subResults[subId] = newObj;
            console.log(newObj);

            // Record state changes
            if (id) {
                if (subFakeUpdates[subId] === undefined) subFakeUpdates[subId] = [id];
                else subFakeUpdates[subId].push(id);
            }
            subscriptions[subId](newObj);
        },
        deleteRelation: (uid, relation) => {
            sendEvent(connection, 'delete_relation', { uid, relation });
        },
        reorderItemInArray: (uid, item, relUid, subIds, eventId) => {
            sendEvent(connection, 'reorder_item_in_array', {
                uid,
                item,
                relUid,
                subIds,
                id: eventId,
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
                    if (response.success && response.schemas) resolver((buildGraph as any)([response.schemas])[0]);
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
                    if (response.success && response.packages) resolve((buildGraph as any)([response.packages])[0]);
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
        runExecutable,
        runExecutableInClient,
        runExecutableStreamed,
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
                    if (response.success) resolve((response.results || []).map((el: any) => buildGraph(el)));
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
                    if (response.success && response.results) resolve((buildGraph as any)([response.results])[0]);
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
            exhaustedLeases.push(leased);
            sendEvent(connection, 'lease_uid', { uid: leased });
            return leased;
        },
        disablePackage: (packageName: string) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'disable_package', { packageName }, id);
            }),
        enablePackage: (packageName: string) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'enable_package', { packageName }, id);
            }),
        recalculateBacklinks: (fromUids, toUids, depth) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'recalculate_backlinks', { fromUids, toUids, depth }, id);
            }),
        addBacklinks: (fromUids, toUids) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'add_backlinks', { fromUids, toUids }, id);
            }),
        getDataFromSubscription: (subId) => {
            return Array.isArray(subResults[subId])
                ? buildGraph(subResults[subId])
                : buildGraph([subResults[subId]])[0];
        },
        startSyncListen: (resource, key) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'start_sync_listen', { resource, key }, id);
            }),
        updateSyncResource: (resource, uids) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'update_sync_resource', { resource, uids }, id);
            }),
        acknowledgeSync: (resource, key, uids) =>
            new Promise((resolve, reject) => {
                const id = getRandomInt();
                callbacks[id] = (response: any) => {
                    if (response.success && response.results) resolve(response.results);
                    else reject(response);
                };
                sendEvent(connection, 'acknowledge_sync', { resource, key, uids }, id);
            }),
    };

    return api;
}

export function getExecutableId(pkg: PackageDeclaration, name: string) {
    return `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/executable/${name}`;
}
