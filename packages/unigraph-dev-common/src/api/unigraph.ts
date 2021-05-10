// FIXME: This file is ambiguous in purpose! Move utils to utils folder and keep this a small interface with a window object.

import { typeMap } from '../types/consts'
import { SchemaDgraph } from '../types/json-ts';
import { PackageDeclaration } from '../types/packages';
import { UnigraphNotification } from '../types/unigraph';
import { base64ToBlob } from '../utils/utils';

/** Unigraph interface */ // Don't remove this line - needed for Monaco to work

/**
 * Global Unigraph API for applications.
 * 
 * Can be either accessed over WebSocket or directly from the main server thread. If 
 * accessed over WebSocket, Promise functionality is implemented using callback messages.
 * 
 * NOTE:
 * 1) If you're using Unigraph API over websocket, check out the server side 
 * documentations as well, since there would be more detail in context.
 */
export interface Unigraph<TT = WebSocket | false> {
    backendConnection: TT;
    /** Messages received from backend. Only used when running over WebSocket. */
    backendMessages: string[];
    eventTarget: EventTarget;
    /** Gets the status of the current Unigraph daemon. */
    getStatus(): Promise<any>;
    /** 
     * Create a new schema using the json-ts format and add it to cache.
     * 
     * Users should use `ensurePackage` and `ensureSchema` for applications.
     */
    createSchema(schema: any): Promise<any>;
    /**
     * Checks if Unigraph server has the schema with the given name. 
     * 
     * If not, create the schema defined in `fallback` instead.
     *  
     * @param name the schema name, starting with `$/schema/`
     * @param fallback the fallback schema, with the json-ts format.
     */
    ensureSchema(name: string, fallback: any): Promise<any>;
    /**
     * Checks if Unigraph server has the package with the given name.
     * 
     * If not, create the package defined in `fallback` instead.
     * 
     * @param packageName the unique package name, such as `unigraph.core`. 
     * You can also attach a version number, such as `unigraph.core@0.0.1`.
     * @param fallback the fallback schema with the `PackageDeclaration` format.
     */
    ensurePackage(packageName: string, fallback: PackageDeclaration): Promise<any>;
    /**
     * Subscribes to a Unigraph type, and call the callback function every time the subscription is updated.
     * 
     * @param name the type name. Can be `$/schema/`, `$/package/xxx/xxx/schema/` or `any` (subscribe to all objects).
     * @param callback the callback function.
     * @param eventId can be left empty - in this case, we will generate one for you, 
     * but you cannot get the subscription elsewhere other than from callback.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    subscribeToType(name: string, callback: Function, eventId?: number | undefined): Promise<any>;
    /**
     * Subscribe to a Unigraph object with a given UID, and call the callback function evry time the subscription is updated.
     * 
     * @param uid UID of the unigraph object, of the format `0xabcd`
     * @param callback the callback function.
     * @param eventId can be left empty - in this case, we will generate one for you, 
     * but you cannot get the subscription elsewhere other than from callback.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    subscribeToObject(uid: string, callback: Function, eventId?: number | undefined): Promise<any>;
    /**
     * Subscribe to a Unigraph query and call the callback function evry time the subscription is updated.
     * 
     * @param fragment DQL (GraphQL+-) Query fragment such as `(func: fn1(something)){ uid expand(_predicate_) }`
     * @param callback the callback function.
     * @param eventId can be left empty - in this case, we will generate one for you, 
     * but you cannot get the subscription elsewhere other than from callback.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    subscribeToQuery(fragment: string, callback: Function, eventId?: number | undefined): Promise<any>;
    /** Unsubscribes using the subscription ID. */
    unsubscribe(id: number): any;
    /**
     * Add an object to Unigraph. For more guidelines, see the overview docs folder.
     * 
     * @param object The object to be added.
     * @param schema Schema of that object, must be valid. Such as: `$/schema/abc`
     */
    addObject(object: any, schema: string): any;
    /** 
     * Gets all objects of a certain type name. 
     * 
     * @param name schema name of the type, such as: `$/schema/abd`.
     */
    getType(name: string): any;
    /**
     * Gets many query results at once using 1 single transaction.
     * 
     * @param fragments Array of DQL (GraphQL+-) Query fragments - such as `(func: fn1(something)){ uid expand(_predicate_) }`
     */
    getQueries(fragments: string[]): any;
    /** Deletes an object by its UID. */
    deleteObject(uid: string): any;
    /**
     * Updates a object simply using the SPO triplet format.
     * 
     * Deprecated: this is from a past era and should not be used.
     */
    updateSimpleObject(object: any, predicate: string, value: any): any;
    /**
     * Updates an existing object by its UID and describing the new object.
     * 
     * @param uid The uid string of the object, of the format `0xabcd`.
     * @param newObject The new object. Only include the parts you want to be updated.
     * @param upsert Whether to perform an upsert, defaults to `true`. Note that if
     * not upserting, the new object is going to be the only values of that UID. Thus,
     * make sure your update is minimal.
     */
    updateObject(uid: string, newObject: any, upsert?: boolean): any;
    /** Gets all referenceables from the library (like primitives, schemas, shorthands, etc) */
    getReferenceables(): Promise<any>;
    /** Deprecated: get selected referenceables. */
    getReferenceables(key?: string | undefined, asMapWithContent?: boolean | undefined): Promise<any>;
    /** Gets a list of schemas. */
    getSchemas(schemas?: string[] | undefined, resolve?: boolean): Promise<Record<string, SchemaDgraph>>;
    /** Gets a list of packages. */
    getPackages(packages?: string[] | undefined): Promise<Record<string, PackageDeclaration>>;
    /**
     * Fetches a URL and return its contents in Blob format.
     * 
     * Parameters should be similar to the fetch arguments.
     * 
     * This is mainly for bypassing the CORS rules of websites - for other purposes please use backend
     * executables instead.
     */
    proxyFetch(url: string | URL, options?: Record<string, any>): Promise<Blob>;
    /**
     * Implement a graph-like data structure based on js pointers from uid references.
     * 
     * Since pointers are not serializable, this must be done on the client side.
     * 
     * @param objects Objects with uid references as one of their fields
     */
    buildGraph(objects: any[]): any[];
    /**
     * Imports a list of objects (that might refer to each other) with uid as one of their fields.
     * 
     * @param objects A list of objects.
     */
    importObjects(objects: any[] | string): Promise<any>;
    /**
     * Runs an executable with the given global ID and parameters.
     * 
     * @param unigraphid The global executable id of the form `$/package/xxx/xxx/executable/abc`.
     * You can use the global function `getExecutableId` to find it.
     * @param params The parameters defined for that executable.
     */
    runExecutable<T>(unigraphid: string, params: T): Promise<any>;
    /**
     * Adds a notification to the global notification list.
     * 
     * @param item Of type UnigraphNotification: `{from: "<sender>", name: "<title>", content: "<content>"}`
     */
    addNotification(item: UnigraphNotification): Promise<any>;
    /**
     * Returns the AppState object for the selected string. Not implemented in backend API (for now).
     * 
     * @param name Name of the state object - this is globally (to the app) unique
     */
    getState(name: string): AppState;
    /**
     * Adds a state to the global state manager. Not available server side (for now).
     * 
     * @param name Name of the state object - this is globally (to the app) unique
     * @param initialValue Initial value, could be anything
     */
    addState<T = any>(name: string, initialValue: T): any;
    /**
     * Deletes the state specified by the name. Not available server side (for now).
     * 
     * @param name Name of the state object - this is globally (to the app) unique
     */
    deleteState(name: string): any;
}
/** End of unigraph interface */ // Don't remove this line - needed for Monaco to work
/**
 * Implement a graph-like data structure based on js pointers from uid references.
 * 
 * Since pointers are not serializable, this must be done on the client side.
 * 
 * @param objects Objects with uid references
 */
export function buildGraph(objects: any[]): any[] {

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

type AppState<T = any> = {
    value: T,
    subscribers: ((newValue: T) => any)[],
    subscribe: (fn: (newValue: T) => any) => any,
    setValue: (newValue: T) => any,
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
        getState: (name) => states[name],
        addState: (name, initialValue) => {
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
        subscribeToQuery: (fragment, callback, eventId = undefined) => new Promise((resolve, reject) => {
            const id = typeof eventId === "number" ? eventId : getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success) resolve(id);
                else reject(response);
            };
            subscriptions[id] = (result: any) => callback(result);
            sendEvent(connection, "subscribe_to_query", {queryFragment: fragment}, id);
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
        updateObject: (uid, newObject, upsert = true) => {
            sendEvent(connection, "update_object", {uid: uid, newObject: newObject, upsert: upsert});
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
                schemas: [],
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
            sendEvent(connection, "run_executable", {"unigraph.id": unigraphid, params: params ? params : {}}, id);
        }),
        getType: (name) => {throw Error("Not implemented")},
        getQueries: (name) => {throw Error("Not implemented")},
        addNotification: (item) => new Promise((resolve, reject) => {
            const id = getRandomInt();
            callbacks[id] = (response: any) => {
                if (response.success && response.schemas) resolve(response.schemas);
                else reject(response);
            };
            sendEvent(connection, "add_notification", {item: item}, id);
        })
    }
}

export function getExecutableId(pkg: PackageDeclaration, name: string) { 
    return `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/executable/${name}` 
}