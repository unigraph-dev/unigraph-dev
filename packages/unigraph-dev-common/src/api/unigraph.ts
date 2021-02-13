// FIXME: This file is ambiguous in purpose! Move utils to utils folder and keep this a small interface with a window object.

export interface Unigraph {
    backendConnection: WebSocket;
    backendMessages: string[];
    eventTarget: EventTarget;
    createSchema(schema: any): Promise<any>;
    ensureSchema(name: string, fallback: any): Promise<any>;
    subscribeToType(name: string, callback: Function, eventId: number | undefined): Promise<number>;
    subscribeToObject(uid: string, callback: Function, eventId: number | undefined): Promise<number>;
    unsubscribe(id: number): any;
    addObject(object: any, schema: string): any;
    deleteObject(uid: string): any;
    unpad(object: any): any;
    updateSimpleObject(object: any, predicate: string, value: any): any;
    getReferenceables(): Promise<any>;
    getReferenceables(key: string | undefined, asMapWithContent: boolean | undefined): Promise<any>;
    getSchemas(schemas: string[] | undefined): Promise<Map<string, SchemaDgraph>>;
}

import { typeMap } from '../types/consts'
import { SchemaDgraph } from '../types/json-ts';

function unpadRecurse(object: any) {
    let result: any = undefined;
    if (typeof object === "object" && !Array.isArray(object)) {
        result = {};
        let predicate = Object.keys(object).find(p => p.startsWith("_value"));
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
    };
    return result;
}

function unpad(object: any) {
    return {...unpadRecurse(object), uid: object.uid}
}

export default function unigraph(url: string): Unigraph {
    let connection = new WebSocket(url);
    let messages: any[] = [];
    let eventTarget: EventTarget = new EventTarget();
    let callbacks: Record<string, Function> = {};
    let subscriptions: Record<string, Function> = {};

    function sendEvent(conn: WebSocket, name: string, params: any, id?: Number | undefined) {
        if (!id) id = Date.now();
        conn.send(JSON.stringify({
            "type": "event",
            "event": name,
            "id": id,
            ...params
        }))
    }

    connection.onmessage = (ev) => {
        try {
            let parsed = JSON.parse(ev.data);
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
        createSchema: (schema) => new Promise((resolve, reject) => {
            let id = Date.now();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            sendEvent(connection, "create_unigraph_schema", {schema: schema}, id)
        }),
        ensureSchema: (name, fallback) => new Promise((resolve, reject) => {
            let id = Date.now();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            sendEvent(connection, "ensure_unigraph_schema", {name: name, fallback: fallback})
        }),
        subscribeToType: (name, callback, eventId = undefined) => new Promise((resolve, reject) => {
            let id = typeof eventId === "number" ? eventId : Date.now();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => callback(result);
            sendEvent(connection, "subscribe_to_type", {schema: name}, id);
        }),
        subscribeToObject: (uid, callback, eventId = undefined) => new Promise((resolve, reject) => {
            let id = typeof eventId === "number" ? eventId : Date.now();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => callback(result[0]);
            let frag = `(func: uid(${uid})) @recurse { uid expand(_predicate_) }`
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
        updateSimpleObject: (object, predicate, value) => {
            let predicateUid = object['_value'][predicate].uid;
            sendEvent(connection, "update_spo", {uid: predicateUid, predicate: typeMap[typeof value], value: value})
        },
        getReferenceables: (key: string = "unigraph.id", asMapWithContent: boolean = false) => new Promise((resolve, reject) => {
            let id = Date.now();
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
            let id = Date.now();
            callbacks[id] = (response: any) => {
                if (response.success && response.schemas) resolve(response.schemas);
                else reject(response);
            };
            sendEvent(connection, "get_schemas", {
                schemas: []
            }, id);
        })
    }
}

