// FIXME: This file is ambiguous in purpose! Move utils to utils folder and keep this a small interface with a window object.

import React from 'react';
import { string } from 'yargs';
import { typeMap } from '../types/consts'
import { PackageDeclaration } from '../types/packages';
import { Unigraph, AppState, UnigraphObject as IUnigraphObject } from '../types/unigraph';
import { base64ToBlob, isJsonString } from '../utils/utils';

const RETRY_CONNECTION_INTERVAL = 5000;

function getPath (obj: any, path: string | string[]): any {
    if (path.length === 0) return new UnigraphObject(obj);
    if (!Array.isArray(path)) path = path.split('/').filter(e => e.length);
    const values = Object.keys(obj).filter(el => el.startsWith('_value'));
    if (values.length > 1) {
        throw new TypeError('Object should have one value only');
    } else if (values.length === 1) {
        return getPath(obj[values[0]], path);
    } else if (Object.keys(obj).includes(path[0])){
        return getPath(obj[path[0]], path.slice(1));
    } else {
        return undefined;
        //throw new RangeError('Requested path doesn\'t exist')
    }
}

function getObjectAsRecursivePrimitive (object: any) {
    let targetValue: any = undefined;
    Object.keys(object).forEach(el => {
        if (el.startsWith("_value.")) {
            targetValue = object[el];
        } else if (el.startsWith("_value") && typeof object[el] === "object") {
            const subObj = getObjectAsRecursivePrimitive(object[el]);
            if (subObj || subObj === "" || subObj === 0 || subObj === false) targetValue = subObj;
        }
    });
    return targetValue;
}

export const getObjectAs = (object: any, type: "primitive") => {
    if (type === "primitive") {
        return getObjectAsRecursivePrimitive(object);
    }
}

// TODO: Switch to prototype-based, faster helper functions
// TODO: Benchmark these helper functions
export class UnigraphObject extends Object {

    constructor(obj: any) {
        super(obj);
        Object.setPrototypeOf(this, UnigraphObject.prototype)
    }

    get = (path: string | string[]) => {
        try { 
            return getPath(this, path)
        } catch (e) {
            console.error(e);
            console.log(this)
            return e;
        }};
    getMetadata = () => {
        return undefined;
    }
    getType = () => {
        return (this as any).type['unigraph.id'];
    }
    getRefType = () => {
        return undefined;
    }
    as = (type: string) => getObjectAs(this, type as any)
}

/**
 * Implement a graph-like data structure based on js pointers from uid references.
 * 
 * Since pointers are not serializable, this must be done on the client side.
 * 
 * @param objects Objects with uid references
 */
export function buildGraph(objects: UnigraphObject[]): UnigraphObject[] {

    const objs: any[] = JSON.parse(JSON.stringify(objects)).map((el: any) => new UnigraphObject(el))
    const dict: any = {}
    objs.forEach(object => {if (object?.uid) dict[object.uid] = object})

    function buildDictRecurse(obj: any) {
        if (obj && typeof obj === "object" && Array.isArray(obj)) {
            obj.forEach((val, index) => {
                if(val?.uid && !dict[val.uid] && Object.keys(val).length !== 1) dict[val.uid] = obj[index];
                buildDictRecurse(val)
            })
        } else if (obj && typeof obj === "object") {
            Object.entries(obj).forEach(([key, value]: [key: string, value: any]) => {
                if(value?.uid && !dict[value.uid] && Object.keys(value).length !== 1) dict[value.uid] = obj[key];
                buildDictRecurse(value)
            })
        }
    }

    function buildGraphRecurse(obj: any) {
        if (obj && typeof obj === "object" && Array.isArray(obj)) {
            obj.forEach((val, index) => {
                if(val?.uid && dict[val.uid]) obj[index] = dict[val.uid];
                buildGraphRecurse(val)
            })
        } else if (obj && typeof obj === "object") {
            Object.entries(obj).forEach(([key, value]: [key: string, value: any]) => {
                if(value?.uid && dict[value.uid]) obj[key] = dict[value.uid];
                buildGraphRecurse(value)
            })
        }
    }

    objs.forEach(object => buildDictRecurse(object))
    objs.forEach(object => buildGraphRecurse(object))

    return objs

}

export function getRandomInt() {return Math.floor(Math.random() * Math.floor(1000000))}

export default function unigraph(url: string, browserId: string): Unigraph<WebSocket | undefined> {
    const connection: {current: WebSocket | undefined} = {current: undefined}; 
    const messages: any[] = [];
    const eventTarget: EventTarget = new EventTarget();
    // eslint-disable-next-line @typescript-eslint/ban-types
    const callbacks: Record<string, Function> = {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    const subscriptions: Record<string, Function> = {};
    const states: Record<string, AppState> = {};
    const caches: Record<string, any> = {
        // @ts-expect-error: already checked if not JSON
        namespaceMap: isJsonString(window.localStorage.getItem("caches/namespaceMap")) ? JSON.parse(window.localStorage.getItem("caches/namespaceMap")) : false 
    };
    const cacheCallbacks: Record<string, any[]> = {};
    let retries: any = false;
    let readyCallback = () => undefined;
    const msgQueue: string[] = [];

    const getState = (name: string) => {
        if (name && states[name]) {
            return states[name];
        } else if (!name) {
            return states
        } else return api.addState(name, undefined);
    }

    const addState = (name: string, initialValue: any) => {
        if (!states[name]) {
            const subs: ((newValue: any) => any)[] = [];
            const state = {
                value: initialValue,
                subscribers: subs,
                subscribe: (subscriber: (newValue: any) => any) => subs.push(subscriber),
                setValue: undefined as any
            }
            state.setValue = (newValue: any) => {
                state.value = newValue;
                subs.forEach(sub => sub(state.value));
            }
            states[name] = state;
            return state;
        } else {
            return states[name];
        }
    }

    function connect () {
        const urlString = new URL(url);
        urlString.searchParams.append('browserId', browserId);
        if (getState('unigraph/connected').value !== undefined) urlString.searchParams.append('revival', "true");
        if (connection.current?.readyState !== 3 /* CLOSED */ && connection.current) return;
        connection.current = new WebSocket(urlString.toString());

        connection.current.onopen = () => {
            getState('unigraph/connected').setValue(true);
            if (retries) clearInterval(retries);
            if (getState('unigraph/connected').value !== undefined && readyCallback) readyCallback(); 
            msgQueue.forEach(el => connection.current?.send(el));
            msgQueue.length = 0;
        }
        connection.current.onclose = () => {
            getState('unigraph/connected').setValue(false);
            retries = setInterval(() => {
                connect();
            }, RETRY_CONNECTION_INTERVAL)
        }

        connection.current.onmessage = (ev) => {
            let parsed: any;
            try {
                parsed = JSON.parse(ev.data);
            } catch (e) {
                console.error("Returned non-JSON reply!")
                console.log(e)
                console.log(ev.data);
                return false;
            }
            messages.push(parsed);
            eventTarget.dispatchEvent(new Event("onmessage", parsed));
            if (parsed.type === "response" && parsed.id && callbacks[parsed.id]) callbacks[parsed.id](parsed);
            if (parsed.type === "cache_updated" && parsed.name) {
                caches[parsed.name] = parsed.result;
                window.localStorage.setItem("caches/"+parsed.name, JSON.stringify(parsed.result));
                cacheCallbacks[parsed.name]?.forEach(el => el(parsed.result));
            }
            if (parsed.type === "subscription" && parsed.id && subscriptions[parsed.id] && parsed.result) subscriptions[parsed.id](parsed.result);
            if (parsed.type === "open_url" && window) window.open(parsed.url, "_blank") 
        }
    }

    addState('unigraph/connected', undefined);

    connect();

    function sendEvent(conn: {current: WebSocket | undefined}, name: string, params: any, id?: number | undefined) {
        if (!id) id = getRandomInt();
        const msg = JSON.stringify({
            "type": "event",
            "event": name,
            "id": id,
            ...params
        });
        if (getState('unigraph/connected').value === true && conn.current) conn.current.send(msg)
        else {msgQueue.push(msg); connect()}
    }
    
    const api: Unigraph<WebSocket | undefined>  = {
        getState: getState,
        addState: addState,
        deleteState: (name) => delete states[name],
        backendConnection: connection,
        backendMessages: messages,
        eventTarget: eventTarget,
        buildGraph: buildGraph,
        onReady: (callback: any) => {readyCallback = callback},
        getStatus: () => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            sendEvent(connection, 'get_status', {}, id)
        }),
        onCacheUpdated: (cache, callback) => {
            if (Array.isArray(cacheCallbacks[cache])) {
                cacheCallbacks[cache].push(callback)
            } else cacheCallbacks[cache] = [callback];
        },
        createSchema: (schema) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            sendEvent(connection, "create_unigraph_schema", {schema: schema}, id)
        }),
        ensureSchema: (name, fallback) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            sendEvent(connection, "ensure_unigraph_schema", {name: name, fallback: fallback}, id)
        }),
        ensurePackage: (packageName, fallback) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            sendEvent(connection, "ensure_unigraph_package", {packageName: packageName, fallback: fallback}, id)
        }),
        subscribeToType: (name, callback, eventId = undefined, options: any) => new Promise((resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any[]) => callback(buildGraph(result.map((el: any) => new UnigraphObject(el))));
            sendEvent(connection, "subscribe_to_type", {schema: name, options: options}, id);
        }),
        // eslint-disable-next-line no-async-promise-executor
        subscribeToObject: (uid, callback, eventId = undefined, options: any) => new Promise(async (resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => result.length === 1 ? callback(new UnigraphObject(result[0])) : callback(result.map((el: any) => new UnigraphObject(el)));
            if (typeof options?.queryFn === "function") options.queryFn = options.queryFn("QUERYFN_TEMPLATE")
            sendEvent(connection, "subscribe_to_object", {uid, options}, id);
        }), 
        subscribeToQuery: (fragment, callback, eventId = undefined, noExpand = false) => new Promise((resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any[]) => callback(result.map((el: any) => new UnigraphObject(el)));
            sendEvent(connection, "subscribe_to_query", {queryFragment: fragment, noExpand}, id);
        }), 
        unsubscribe: (id) => {
            sendEvent(connection, "unsubscribe_by_id", {}, id);
        },
        addObject: (object, schema) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response.results);
                else reject(response);
            };
            sendEvent(connection, "create_unigraph_object", {object: object, schema: schema, id: id});
        }),
        deleteObject: (uid, permanent?) => {
            sendEvent(connection, "delete_unigraph_object", {uid, permanent});
        },
        updateSimpleObject: (object, predicate, value) => { // TODO: This is very useless, should be removed once we get something better
            const predicateUid = object['_value'][predicate].uid;
            sendEvent(connection, "update_spo", {uid: predicateUid, predicate: typeMap[typeof value], value: value})
        },
        updateObject: (uid, newObject, upsert = true, pad = true, subIds, origin) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            sendEvent(connection, "update_object", {uid, newObject, upsert, pad, id, subIds, origin});
        }),
        deleteRelation: (uid, relation) => {
            sendEvent(connection, "delete_relation", {uid: uid, relation: relation});
        },
        reorderItemInArray: (uid, item, relUid, subIds) => {
            sendEvent(connection, "reorder_item_in_array", {uid: uid, item: item, relUid: relUid, subIds: subIds});
        },
        deleteItemFromArray: (uid, item, relUid, subIds) => {
            sendEvent(connection, "delete_item_from_array", {uid: uid, item: item, relUid: relUid, subIds: subIds});
        },
        getReferenceables: (key = "unigraph.id", asMapWithContent = false) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response.result.map((obj: { [x: string]: any; }) => obj["unigraph.id"]));
                else reject(response);
            };
            sendEvent(connection, "query_by_string_with_vars", {
                vars: {},
                query: `{
                    q(func: has(unigraph.id)) {
                        unigraph.id
                    }
                }`
            }, id);
        }),
        getSchemas: (schemas: string[] | undefined, resolve = false) => new Promise((resolver, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.schemas) resolver(response.schemas);
                else reject(response);
            };
            sendEvent(connection, "get_schemas", {
                schemas: schemas,
                resolve: resolve
            }, id);
        }),
        getPackages: (packages) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.packages) resolve(response.packages);
                else reject(response);
            };
            sendEvent(connection, "get_packages", {
                packages: []
            }, id);
        }),
        /**
         * Proxifies a fetch request through the server process. This is to ensure a similar experience 
         * as using a browser (and NOT using an webapp).
         * 
         * Accepts exactly parameters of fetch. Returns a promise containing the blob content
         * (you can use blobToJson to convert to JSON if that's what's returned)
         * 
         * @param url 
         * @param options 
         */
        proxyFetch: (url, options?) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (responseBlob: {success: boolean, blob: string}) => {
                if (responseBlob.success && responseBlob.blob)
                    resolve(base64ToBlob(responseBlob.blob))
                else reject(responseBlob);
            };
            sendEvent(connection, "proxy_fetch", {
                url: url,
                options: options
            }, id);
        }),
        importObjects: (objects) => new Promise((resolve, reject) => {
            if (typeof objects !== "string") objects = JSON.stringify(objects)
            const id = getRandomInt();
            sendEvent(connection, "import_objects", {objects: objects}, id);
        }),
        runExecutable: (uid, params?, context?, fnString?) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) {
                    if (response.returns?.return_function_component !== undefined && !fnString) {
                        // eslint-disable-next-line no-new-func
                        const retFn = new Function('React', 'return ' + response.returns?.return_function_component)(React);
                        console.log(retFn);
                        resolve(retFn);
                    } else {
                        resolve(response.returns ? response.returns : {});
                    }
                } else reject(response);
            };
            sendEvent(connection, "run_executable", {"uid": uid, params: params ? params : {}}, id);
        }),
        getNamespaceMapUid: (name) => {throw Error("Not implemented")},
        getNamespaceMap: () => caches.namespaceMap,
        getType: (name) => {throw Error("Not implemented")},
        getQueries: (queries: any[]) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response.results ? response.results : {});
                else reject(response);
            };
            sendEvent(connection, "get_queries", {"fragments": queries}, id);
        }),
        addNotification: (item) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.schemas) resolve(response.schemas);
                else reject(response);
            };
            sendEvent(connection, "add_notification", {item: item}, id);
        }),
        getSearchResults: (query, display, hops, searchOptions) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.results) resolve(response.results);
                else reject(response);
            };
            sendEvent(connection, "get_search_results", {query, display, hops, searchOptions}, id);
        }),
        getSchemaMap: () => caches.schemaMap,
        exportObjects: (uids, options) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.result) resolve(response.result);
                else reject(response);
            };
            sendEvent(connection, "export_objects", {uids, options}, id);
        }),
        addPackage: (manifest, update = false) => {
            sendEvent(connection, "add_unigraph_package", {package: manifest, update})
        }
    }

    return api;
}

export function getExecutableId(pkg: PackageDeclaration, name: string) { 
    return `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/executable/${name}` 
}