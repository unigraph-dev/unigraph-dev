// FIXME: This file is ambiguous in purpose! Move utils to utils folder and keep this a small interface with a window object.

import { typeMap } from '../types/consts'
import { PackageDeclaration } from '../types/packages';
import { Unigraph, AppState, UnigraphObject as IUnigraphObject } from '../types/unigraph';
import { base64ToBlob, isJsonString } from '../utils/utils';

function getPath (obj: any, path: string | string[]): any {
    if (path.length === 0) return obj;
    if (!Array.isArray(path)) path = path.split('/').filter(e => e.length);
    const values = Object.keys(obj).filter(el => el.startsWith('_value'));
    if (values.length > 1) {
        throw new TypeError('Object should have one value only');
    } else if (values.length === 1) {
        return getPath(obj[values[0]], path);
    } else if (Object.keys(obj).includes(path[0])){
        return getPath(obj[path[0]], path.slice(1));
    } else {
        throw new RangeError('Requested path doesn\'t exist')
    }
}

function getObjectAsRecursivePrimitive (object: any) {
    let targetValue: any = undefined;
    Object.keys(object).forEach(el => {
        if (el.startsWith("_value.")) {
            targetValue = object[el];
        } else if (el.startsWith("_value") && typeof object[el] === "object") {
            const subObj = getObjectAsRecursivePrimitive(object[el]);
            if (subObj) targetValue = subObj;
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

    get = (path: string | string[]) => getPath(this, path);
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

    objs.forEach(object => buildGraphRecurse(object))

    return objs

}

export function getRandomInt() {return Math.floor(Math.random() * Math.floor(1000000))}

export default function unigraph(url: string): Unigraph<WebSocket> {
    const connection = new WebSocket(url);
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

    function sendEvent(conn: WebSocket, name: string, params: any, id?: number | undefined) {
        if (!id) id = getRandomInt();
        conn.send(JSON.stringify({
            "type": "event",
            "event": name,
            "id": id,
            ...params
        }))
    }

    connection.onmessage = (ev) => {
        let parsed;
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
            window.localStorage.setItem("caches/"+parsed.name, JSON.stringify(parsed.result))
        }
        if (parsed.type === "subscription" && parsed.id && subscriptions[parsed.id]) subscriptions[parsed.id](parsed.result);
    }
    

    return {
        getState: (name) => states[name] ,
        addState: (name, initialValue) => {
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
        },
        deleteState: (name) => delete states[name],
        backendConnection: connection,
        backendMessages: messages,
        eventTarget: eventTarget,
        buildGraph: buildGraph,
        getStatus: () => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            sendEvent(connection, 'get_status', {}, id)
        }),
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
        subscribeToType: (name, callback, eventId = undefined, all = false, showHidden: false) => new Promise((resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any[]) => callback(buildGraph(result.map((el: any) => new UnigraphObject(el))));
            sendEvent(connection, "subscribe_to_type", {schema: name, all, showHidden}, id);
        }),
        // eslint-disable-next-line no-async-promise-executor
        subscribeToObject: (uid, callback, eventId = undefined) => new Promise(async (resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            if (uid.startsWith('$/')) {
                // Is named entity
                if (caches.namespaceMap) {
                    uid = caches.namespaceMap[uid].uid;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    uid = caches.namespaceMap[uid].uid;
                }
            }
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => callback(new UnigraphObject(result[0]));
            const frag = `(func: uid(${uid})) @recurse { uid unigraph.id expand(_userpredicate_) }`
            sendEvent(connection, "subscribe_to_object", {queryFragment: frag}, id);
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
        deleteObject: (uid) => {
            sendEvent(connection, "delete_unigraph_object", {uid: uid});
        },
        updateSimpleObject: (object, predicate, value) => { // TODO: This is very useless, should be removed once we get something better
            const predicateUid = object['_value'][predicate].uid;
            sendEvent(connection, "update_spo", {uid: predicateUid, predicate: typeMap[typeof value], value: value})
        },
        updateObject: (uid, newObject, upsert = true, pad = true) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            sendEvent(connection, "update_object", {uid: uid, newObject: newObject, upsert: upsert, pad: pad, id: id});
        }),
        deleteRelation: (uid, relation) => {
            sendEvent(connection, "delete_relation", {uid: uid, relation: relation});
        },
        deleteItemFromArray: (uid, item, relUid) => {
            sendEvent(connection, "delete_item_from_array", {uid: uid, item: item, relUid: relUid});
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
        runExecutable: (unigraphid, params?) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response.returns ? response.returns : {});
                else reject(response);
            };
            sendEvent(connection, "run_executable", {"unigraph.id": unigraphid, params: params ? params : {}}, id);
        }),
        getNamespaceMapUid: (name) => {throw Error("Not implemented")},
        getNamespaceMap: () => caches.namespaceMap,
        getType: (name) => {throw Error("Not implemented")},
        getQueries: (name) => {throw Error("Not implemented")},
        addNotification: (item) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.schemas) resolve(response.schemas);
                else reject(response);
            };
            sendEvent(connection, "add_notification", {item: item}, id);
        }),
        getSearchResults: (query, method = "fulltext") => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.results) resolve(response.results);
                else reject(response);
            };
            sendEvent(connection, "get_search_results", {query: query, method: method}, id);
        })
    }
}

export function getExecutableId(pkg: PackageDeclaration, name: string) { 
    return `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/executable/${name}` 
}