// FIXME: This file is ambiguous in purpose! Move utils to utils folder and keep this a small interface with a window object.

import { typeMap } from '../types/consts'
import { SchemaDgraph } from '../types/json-ts';
import { PackageDeclaration } from '../types/packages';
import { base64ToBlob } from '../utils/utils';

export interface Unigraph {
    backendConnection: WebSocket;
    backendMessages: string[];
    eventTarget: EventTarget;
    createSchema(schema: any): Promise<any>;
    ensureSchema(name: string, fallback: any): Promise<any>;
    ensurePackage(packageName: string, fallback: PackageDeclaration): Promise<any>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    subscribeToType(name: string, callback: Function, eventId: number | undefined): Promise<number>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    subscribeToObject(uid: string, callback: Function, eventId: number | undefined): Promise<number>;
    unsubscribe(id: number): any;
    addObject(object: any, schema: string): any;
    deleteObject(uid: string): any;
    unpad(object: any): any;
    updateSimpleObject(object: any, predicate: string, value: any): any;
    updateObject(uid: string, newObject: any): any;
    getReferenceables(): Promise<any>;
    getReferenceables(key: string | undefined, asMapWithContent: boolean | undefined): Promise<any>;
    getSchemas(schemas: string[] | undefined): Promise<Map<string, SchemaDgraph>>;
    getPackages(packages: string[] | undefined): Promise<Map<string, PackageDeclaration>>;
    proxyFetch(url: string, options?: Record<string, any>): Promise<Blob>;
    buildGraph(objects: any[]): any[];
}

function unpadRecurse(object: any) {
    let result: any = undefined;
    if (typeof object === "object" && !Array.isArray(object)) {
        result = {};
        const predicate = Object.keys(object).find(p => p.startsWith("_value"));
        if (predicate) { // In simple settings, if contains _value ignore all edge annotations
            result = unpadRecurse(object[predicate]);
        } else {
            result = Object.fromEntries(Object.entries(object).map(([k, v]) => [k, unpadRecurse(v)]));
        }
    } else if (Array.isArray(object)) {
        result = [];
        object.forEach(val => result.push(unpadRecurse(val)));
    } else {
        result = object;
    }
    return result;
}

function unpad(object: any) {
    return {...unpadRecurse(object), uid: object.uid}
}

/**
 * Implement a graph-like data structure based on js pointers from uid references.
 * 
 * Since pointers are not serializable, this must be done on the client side.
 * 
 * @param objects Objects with uid references
 */
function buildGraph(objects: any[]): any[] {

    const objs: any[] = JSON.parse(JSON.stringify(objects))
    const dict: any = {}
    objs.forEach(object => {if (object.uid) dict[object.uid] = object})

    function buildGraphRecurse(obj: any) {
        if (typeof obj === "object" && Array.isArray(obj)) {
            obj.forEach((val, index) => {
                if(val.uid && dict[val.uid]) obj[index] = dict[val.uid];
                buildGraphRecurse(val)
            })
        } else if (typeof obj === "object") {
            Object.entries(obj).forEach(([key, value]: [key: string, value: any]) => {
                if(value.uid && dict[value.uid]) obj[key] = dict[value.uid];
                buildGraphRecurse(value)
            })
        }
    }

    objs.forEach(object => buildGraphRecurse(object))

    return objs

}

export function getRandomInt() {return Math.floor(Math.random() * Math.floor(1000000))}

export default function unigraph(url: string): Unigraph {
    const connection = new WebSocket(url);
    const messages: any[] = [];
    const eventTarget: EventTarget = new EventTarget();
    // eslint-disable-next-line @typescript-eslint/ban-types
    const callbacks: Record<string, Function> = {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    const subscriptions: Record<string, Function> = {};

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
        try {
            const parsed = JSON.parse(ev.data);
            messages.push(parsed);
            eventTarget.dispatchEvent(new Event("onmessage", parsed));
            if (parsed.type === "response" && parsed.id && callbacks[parsed.id]) callbacks[parsed.id](parsed);
            if (parsed.type === "subscription" && parsed.id && subscriptions[parsed.id]) subscriptions[parsed.id](parsed.result);
        } catch (e) {
            console.error("Returned non-JSON reply!")
            console.log(ev.data);
        }
    }
    

    return {
        backendConnection: connection,
        backendMessages: messages,
        eventTarget: eventTarget,
        unpad: unpad,
        buildGraph: buildGraph,
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
        subscribeToType: (name, callback, eventId = undefined) => new Promise((resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => callback(buildGraph(result));
            sendEvent(connection, "subscribe_to_type", {schema: name}, id);
        }),
        subscribeToObject: (uid, callback, eventId = undefined) => new Promise((resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => callback(result[0]);
            const frag = `(func: uid(${uid})) @recurse { uid expand(_predicate_) }`
            sendEvent(connection, "subscribe_to_object", {queryFragment: frag}, id);
        }), 
        unsubscribe: (id) => {
            sendEvent(connection, "unsubscribe_by_id", {}, id);
        },
        addObject: (object, schema) => {
            sendEvent(connection, "create_unigraph_object", {object: object, schema: schema});
        },
        deleteObject: (uid) => {
            sendEvent(connection, "delete_unigraph_object", {uid: uid});
        },
        updateSimpleObject: (object, predicate, value) => { // TODO: This is very useless, should be removed once we get something better
            const predicateUid = object['_value'][predicate].uid;
            sendEvent(connection, "update_spo", {uid: predicateUid, predicate: typeMap[typeof value], value: value})
        },
        updateObject: (uid, newObject) => {
            sendEvent(connection, "update_object", {uid: uid, newObject: newObject});
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
        getSchemas: (schemas: string[] | undefined) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.schemas) resolve(response.schemas);
                else reject(response);
            };
            sendEvent(connection, "get_schemas", {
                schemas: []
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
        })
    }
}

