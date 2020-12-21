export interface Unigraph {
    backendConnection: WebSocket;
    backendMessages: string[];
    eventTarget: EventTarget;
    ensureSchema(name: string, fallback: any): Promise<any>;
    subscribeToType(name: string, callback: Function): Promise<number>;
    unsubscribe(id: number): any;
    addObject(object: any, schema: string): any;
    deleteObject(uid: string): any
}

export type RefUnigraphIdType<UID extends string = string> = {
    $ref: {
    key: 'unigraph.id',
    query: UID
    }
};

export function makeUnigraphId(id: string) {
    return { 'unigraph.id': id }
}

export function makeRefUnigraphId(id: string): RefUnigraphIdType {
    return {
    "$ref": {
        "key": "unigraph.id",
        "query": id,
    }
    };
}

function unpad(object: any) {
    let result: any = undefined;
    if (typeof object === "object" && !Array.isArray(object)) {
        result = {};
        let predicate = Object.keys(object).find(p => p.startsWith("_value"));
        if (predicate) { // In simple settings, if contains _value ignore all edge annotations
            result = unpad(object[predicate]);
        } else {
            result = Object.fromEntries(Object.entries(object).map(([k, v]) => [k, unpad(v)]));
        }
    } else if (Array.isArray(object)) {
        result = [];
        object.forEach(val => result.push(unpad(val)));
    } else {
        result = object;
    };
    return result;
}

export default function unigraph(url: string): Unigraph {
    let connection = new WebSocket(url);
    let messages: any[] = [];
    let eventTarget: EventTarget = new EventTarget();
    let callbacks: Record<string, Function> = {};
    let subscriptions: Record<string, Function> = {}

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
        ensureSchema: (name: string, fallback: any) => new Promise((resolve, reject) => {
            // TODO: Ensure schema exists
            let id = Date.now();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(response);
                else reject(response);
            };
            connection.send(JSON.stringify({
                "type": "event",
                "event": "ensure_unigraph_schema",
                "name": name,
                "fallback": fallback,
                "id": id
            }));
        }),
        subscribeToType: (name, callback, simple = true) => new Promise((resolve, reject) => {
            let id = Date.now();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => {
                if (simple) callback(result.map((el: any) => {let uidroot = el.uid; el = unpad(el); el.uid = uidroot; return el;}));
                else callback(result);
            }
            connection.send(JSON.stringify({ // TODO: Write documentations for query variables in subscriptions
                "type": "event",
                "event": "subscribe_to_object",
                "queryFragment": `(func: uid(var${id})) @recurse(depth: 10) {
                    uid 
                    expand(_predicate_) 
                }
                var${id} as var(func: type(Entity)) @cascade @filter(NOT type(Deleted)) {
                    type @filter(eq(<unigraph.id>, "${name}"))
                }`,
                "id": id
            }));
        }),
        unsubscribe: (id) => {
            // TODO: Add unsubscribe support
        },
        addObject: (object, schema) => {
            connection.send(JSON.stringify({
                "type": "event",
                "event": "create_unigraph_object",
                "object": object,
                "schema": schema,
                "id": Date.now()
            }));
        },
        deleteObject: (uid) => {
            connection.send(JSON.stringify({
                "type": "event",
                "event": "delete_unigraph_object",
                "uid": uid
            }));
        }
    }
}

