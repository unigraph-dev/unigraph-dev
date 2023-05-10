import { Executable } from './executableTypes';
import { SchemaAny, SchemaDgraph, SchemaFullName, SchemaShorthandName, UnigraphUid } from './json-ts';
import { PackageDeclaration } from './packages';

/** Unigraph interface */ // Don't remove this line - needed for Monaco to work
export type UnigraphUpsert = {
    queries: string[];
    mutations: any[];
    appends: any[];
};

export type AppState<T = any> = {
    value: T;
    subscribers: ((newValue: T) => any)[];
    /**
     * Subscribe to changes in the state.
     * @param fn Callback to be called when the state changes.
     * @param initial If true, the callback will be called immediately with the current state.
     */
    subscribe: (fn: (newValue: T) => any, initial?: boolean) => any;
    unsubscribe: (fn: (newValue: T) => any) => any;
    setValue: (newValue: T | ((oldValue: T) => T), flush?: boolean) => any;
};

export type UnigraphSchemaDeclaration = {
    name: string;
    schema: any;
};

export type UnigraphContext = {
    schemas: UnigraphSchemaDeclaration[];
    packages: PackageDeclaration[];
    defaultData: any;
};

export type UnigraphHooks = {
    afterSchemasLoaded: (subsId: any, data: any, componentThis: any) => any;
};

export type UnigraphExecutable<T = any> = (context: { params: T }, unigraph: Unigraph) => any;

export type UnigraphNotification = {
    name: string;
    from: string;
    content: string;
    actions?: any[];
};

// Begin subscriptions definition
export type Query = QueryType | QueryObject | QueryRaw | QueryGroup;

export type QueryType = {
    type: 'type';
    name: SchemaShorthandName<string> | SchemaFullName<string, string, string> | SchemaAny | string;
    options?: {
        all?: boolean;
        showHidden?: boolean;
        uidsOnly?: boolean;
        metadataOnly?: boolean;
        first?: number;
        depth?: number;
        queryAs?: string;
    };
};

export type QueryObject = {
    type: 'object';
    uid: UnigraphUid<string> | UnigraphUid<string>[] | string | string[];
    options?: {
        queryAsType?: SchemaShorthandName<string> | SchemaFullName<string, string, string> | string;
        queryFn?: string;
        depth?: number;
    };
};

export type QueryRaw = {
    type: 'query';
    fragment: string;
    options?: {
        noExpand?: boolean;
        skipBuild?: boolean;
    };
};

export type QueryGroup = {
    type: 'group';
    queries: Query[];
};

// End subscriptions definition

/**
 * Prototype of Unigraph objects, which extends on raw objects but with helpful functions.
 */
export type UnigraphObject<T = Record<string, any>> = T & {
    get: (path: string | string[]) => any;
    getMetadata: () => any;
    getType: () => string;
    getRefType: () => 'ref' | 'value';
};

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
export interface Unigraph<TT = WebSocket | undefined> {
    backendConnection: { current: TT };
    /** Messages received from backend. Only used when running over WebSocket. */
    backendMessages: string[];
    eventTarget: EventTarget;
    /** Gets the status of the current Unigraph daemon. */
    getStatus(): Promise<any>;
    /** The specified callback will be invoked once initial Unigraph connecton is established. */
    onReady?(callback: () => void): void;
    onCacheUpdated?(cache: string, callback: (newEl: any) => void, currentCache?: boolean): void;
    getCache?: (cache: string) => any;
    /**
     * Create a new schema using the json-ts format and add it to cache.
     *
     * Users should use `ensurePackage` and `ensureSchema` for applications.
     *
     * @param schema The schema to add to the current graph. Must be in the schema definition format.
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
     * @param options can be used to specify the query options.
     */
    subscribeToType(
        name: QueryType['name'],
        callback: (results: any[]) => void,
        eventId?: number | undefined,
        options?: QueryType['options'],
    ): Promise<any>;
    /**
     * Subscribe to a Unigraph object with a given UID or name, and call the callback function evry time the subscription is updated.
     *
     * @param uid UID of the unigraph object, of the format `0xabcd`; or a named entity starting with `$/`
     * @param callback the callback function.
     * @param eventId can be left empty - in this case, we will generate one for you,
     * but you cannot get the subscription elsewhere other than from callback.
     * @param options can be used to specify the query options.
     */
    subscribeToObject(
        uid: QueryObject['uid'],
        callback: (results: any[] | any) => void,
        eventId?: number | undefined,
        options?: QueryObject['options'],
    ): Promise<any>;
    /**
     * Subscribe to a Unigraph query and call the callback function evry time the subscription is updated.
     *
     * @param fragment DQL (GraphQL+-) Query fragment such as `(func: fn1(something)){ uid expand(_predicate_) }`
     * @param callback the callback function.
     * @param eventId can be left empty - in this case, we will generate one for you,
     * but you cannot get the subscription elsewhere other than from callback.
     * @param options can be used to specify the query options.
     */
    subscribeToQuery(
        fragment: QueryRaw['fragment'],
        callback: (results: any[]) => void,
        eventId?: number | undefined,
        options?: QueryRaw['options'],
    ): Promise<any>;
    /**
     * Subscribe to or update a Unigraph query (with the Query type).
     * @param query the query to subscribe to. Must follow the Query type (note this is different from a GraphQL query)
     * @param callback a callback function. Can leave empty if updating existing one, since the previous one will be called.
     * @param eventId subscription ID (if update, must be the same)
     * @param update whether we're updating the subscription (delta query).
     */
    subscribe(query: Query, callback: (results: any[] | any) => void, eventId?: number, update?: boolean): Promise<any>;
    /**
     * Hibernates (or revives) a Unigraph subscription.
     * @param eventId the subscription ID to (un)hibernate.
     * @param revival whether this is a revival or hibernation.
     */
    hibernateOrReviveSubscription(eventId?: number | number[], revival?: boolean): Promise<any>;
    /** Unsubscribes using the subscription ID. */
    unsubscribe(id: number): any;
    /**
     * Add an object to Unigraph. For more guidelines, see the overview docs folder.
     *
     * @param object The object to be added.
     * @param schema Schema of that object, must be valid. Such as: `$/schema/abc`
     * @param padded Whether the object is already in padded format (the Unigraph data model, with `_value` etc.)
     * @param subIds What subscriptions to update after the addition. If not set, all subscriptions will be updated.
     * @param bulk If set to true, some checks will be bypassed.
     */
    addObject(object: any, schema: string, padded?: boolean, subIds?: any[], bulk?: boolean): any;
    /**
     * Reach into the namespace map cache and get a UID corresponding to the name.
     *
     * @param name Name of the named entity/executable/schema, usually starts with `$/`
     */
    getNamespaceMapUid(name: string): string;
    /** Gets the current namespace map. */
    getNamespaceMap?(): any;
    /**
     * Gets all objects of a certain type name.
     *
     * @param name schema name of the type, such as: `$/schema/abd`.
     */
    getType(name: string): any;
    /**
     * Gets many query results at once using 1 single transaction.
     *
     * For more information, see example packages in the `default-package` folder.
     *
     * @param fragments Array of DQL (GraphQL+-) Query fragments - such as `(func: fn1(something)){ uid expand(_predicate_) }`
     * @param getAll whether to get the full objects recursively after querying qualifying UIDs. If you're already declaring
     * the results in the query, this should be set to `false`. (default: `true`)
     * @param batch how many fragments to query at once. (default: `50`)
     * @param commonVars the part of query appended to all batched queries, such as finding the list of all uids of a certain type.
     */
    getQueries(fragments: string[] | string, getAll?: boolean, batch?: number, commonVars?: string): any;
    /**
     * Gets search results given a search query.
     *
     * @param query A string of the desired query. Such as: `minecraft memes`. The query will be stemmed and searched similar to a search engine.
     * @param method A string describing what kind of search to perform. Default is 'fulltext'
     * @param display How to return the results to display. 'indexes' will only fetch the indexes.
     * @param hops How many hops to fetch.
     * @param searchOptions Options for the search query.
     */
    getSearchResults(
        query: { method: 'fulltext' | 'type' | 'uid'; value: any }[],
        display?: string,
        hops?: number,
        searchOptions?: {
            limit?: number;
            noPrimitives?: boolean;
            resultsOnly?: boolean;
            hideHidden?: boolean;
        },
    ): Promise<{ results: any[]; entities: any[] }>;
    /**
     * Deletes an object by its UID.
     *
     * @param uid The UID of the object to delete.
     * @param permanent Whether the deletion is permanent. If true, we will also remove all references, backlinks,
     * and annotations of the object. This process cannot be undone.
     */
    deleteObject(uid: string | string[], permanent?: boolean): any;
    /**
     * Updates objects simply using the SPO triplet format.
     *
     * @param triplets An array of triplets to update, in RDF format, such as [`<0x123> <_value> <0x456> .`]
     * @param isDelete Whether to consider the triplets as deletion. For example, the example triplet will
     * delete the link from `0x123` to `0x456` if `isDelete` is `true`.
     * @param subIds What subscriptions to update after the mutation. If not set, all subscriptions will be updated.
     */
    updateTriplets(triplets: any[], isDelete?: boolean, subIds?: any[] | any): any;
    /**
     * Updates an existing object by its UID and describing the new object.
     *
     * @param uid The uid string of the object, of the format `0xabcd`.
     * @param newObject The new object. Only include the parts you want to be updated.
     * @param upsert Whether to perform an upsert, defaults to `true`. Note that if
     * not upserting, the new object is going to be the only values of that UID. Thus,
     * make sure your update is minimal.
     * @param pad Whether to pad the new object - for partial update this should be false.
     * @param subIds Subscriptions (if known) associated with the updated object.
     * @param origin An array of UID strings used to construct the backlink map of the updated object.
     * You normally doesn't have to use this.
     * @param eagarlyUpdate Whether to process the updates in client side before sending to the server.
     * Setting this to `true` will make the update process much faster, but it must not be an upsert or padded update,
     * and cannot qualify for uniqueness criteria, etc. If you need to do this, you should set `eagarlyUpdate` to `false`
     * and use `sendFakeUpdate` to update the client with the same information while using the uniqueness criteria in the backend instead.
     */
    updateObject(
        uid: string,
        newObject: any,
        upsert?: boolean,
        pad?: boolean,
        subIds?: any[] | any,
        origin?: any[],
        eagarlyUpdate?: boolean,
        thisEventId?: any,
    ): any;
    /**
     * Deletes relationships by supplying the origin UID and JSONs to delete.
     *
     * For example, if we have an array `0x1`, we can put uid as `0x1` and relation as `{
     *   "_value[": [{ "uid": "0x2" }] (note: for list elements, the second UID is the main UID with metadata.)
     * }`
     */
    deleteRelation(uid: string, relation: any): any;
    /**
     * Reorders items in an array (ordered list).
     * @param uid The uid of the target list - must be of type `$/composer/Array`
     * @param item an array of an array of 2 items, first being the original index(es) or uid, second being the desired index(es).
     * @param relationUid Optional. Specifies the uid of the entity this array belongs to. If present, entity relation to it will also be deleted.
     * @param subIds Optional, either an ID or an array of ID with relevant subscriptions. If not set, all subscriptions will be updated.
     */
    reorderItemInArray?(
        uid: string,
        item: [number | string, number] | [number | string, number][],
        relationUid?: string,
        subIds?: any[] | any,
        eventId?: string,
    ): any;
    /**
     * Deletes an item from an array (ordered list).
     *
     * @param uid The uid of the target list - must be of type `$/composer/Array`
     * @param item Either the UID (outer) or the index of an item, or an array of such items.
     * @param relationUid Optional. Specifies the uid of the entity this array belongs to. If present, entity relation to it will also be deleted.
     * @param subIds Optional, either an ID or an array of ID with relevant subscriptions. If not set, all subscriptions will be updated.
     */
    deleteItemFromArray(
        uid: string,
        item: (number | string) | (number | string)[],
        relationUid?: string,
        subIds?: any[] | any,
    ): any;
    /** Gets all referenceables from the library (like primitives, schemas, shorthands, etc) */
    getReferenceables(): Promise<any>;
    /** Deprecated: get selected referenceables. */
    getReferenceables(key?: string | undefined, asMapWithContent?: boolean | undefined): Promise<any>;
    /** Gets a list of schemas. */
    getSchemas(schemas?: string[] | undefined, resolve?: boolean): Promise<Record<string, SchemaDgraph>>;
    /**
     * Gets an object with the given UID or name from Unigraph.
     * If the object is updated, you will not be notified.
     *
     * @param uidOrName either the UID of the object or its name (such as `$/entity/example`).
     * @param options Options for the query.
     */
    getObject(
        uidOrName: string,
        options?: {
            queryAsType?: string | undefined;
        },
    ): Promise<any>;
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
     * Runs an executable in the client side.
     *
     * @param exec The unigraph object of the executable .
     * @param params The parameters defined for that executable.
     * @param fnString Whether to return the executable function as a function or string.
     */
    runExecutableInClient?<T>(
        exec: Executable,
        params: T,
        context?: any,
        fnString?: boolean,
        bypassCache?: boolean,
    ): Promise<any>;
    /**
     * Runs an executable with the given global ID and parameters.
     *
     * @param uid The global executable id of the form `$/package/xxx/xxx/executable/abc`, or simply a database-wide UID.
     * You can use the global function `getExecutableId` to find it.
     * @param params The parameters defined for that executable.
     * @param fnString Whether to return the executable function as a function or string.
     */
    runExecutable<T>(uid: string, params: T, context?: any, fnString?: boolean, bypassCache?: boolean): Promise<any>;
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
    /**
     * Gets a map of all states
     *
     */
    getStateMap?(): Record<string, AppState>;
    /**
     * Signals user intent to run code. One kind of UI Hook. Only available in front-end.
     *
     * @param name Name of the state object - this is globally (to the app) unique
     */
    dispatchCommand?<T>(name: string, params: T, context: any): any;
    /**
     * Gets the schema map in cache.
     * @param schemas
     * @param resolve
     */
    getSchemaMap?(schemas?: string[] | undefined, resolve?: boolean): any;
    /**
     * Get a secret key, from a scope that the current executable has access too.
     * @param key
     */
    getSecret?(scope: string, key: string): string;
    /**
     * Returns a promise that resolves to the request when the HTTP callback endpoint is visited.
     */
    awaitHttpCallback?(key: string): Promise<any>;
    /**
     * Exports a list of specified objects into a JSON file.
     * @param uids The list of objects in a UID string array
     * @param options Options for export
     */
    exportObjects?(uids: string[], options: any): any;
    /**
     * Calls all executors of a given (user) hook by name sequentially.
     * @param name Name of the (user) hook
     * @param params Params object
     */
    callHook?(name: string, params: any): any;
    addPackage?(manifest: any, update?: boolean): any;
    buildUnigraphEntity?(entity: any, schema: string, options: any): any;
    /**
     * Gets all subscriptions of Unigraph. Used as a developer tool for debug.
     */
    getSubscriptions?(): any;
    /**
     * Changes last edited time of an object/objects.
     * @param uids uids of objects to change.
     */
    touch(uids: string[] | string): any;
    leaseUid?(): string;
    disablePackage?(packageName: string): any;
    enablePackage?(packageName: string): any;
    /**
     * Recalculates backlinks from a set of objects, to a set of children.
     *
     * This is done by fetching everything of the given fromUids and see if they still lead to the toUids.
     * If not, the backlink is removed.
     *
     * @param fromUids A list of objects to fetch.
     * @param toUids A list of objects to check if they are still linked to the fromUids.
     * @param depth How deep to check.
     */
    recalculateBacklinks(fromUids: string[], toUids: string[], depth?: number): any;
    /**
     * Adds a list of fromUids (parents) to backlinks (unigraph.origin) of toUids (children).
     * @param fromUids A list of objects to fetch.
     * @param toUids
     */
    addBacklinks(fromUids: string[], toUids: string[]): any;
    /**
     * Sends a fake update to the UI with the updater object for the client.
     * @param subId subscription ID to send the update to
     * @param updater a padded object that contains an UID, which is contained in the subscription result.
     * @param eventId the eventId that's attached to this update. Used to signify the most recent fake update, any update before this will not be triggered.
     * @param fullObject if true, the updater will be understood as a replacement instead of a partial update.
     */
    sendFakeUpdate?(subId: any, updater: any, eventId?: any, fullObject?: boolean): any;
    /**
     * Gets the cached data from a given subscription ID.
     * Obviously, only available in frontend.
     * @param subId Subscription ID.
     */
    getDataFromSubscription?(subId: any): any;

    // Syncing Unigraph changes

    /**
     * Starts listening to changes in a specific sync resource.
     *
     * Make sure to listen to the `sync_updated` events to get all UIDs that have been updated,
     * and then query the database for the objects.
     *
     * If the client was offline and changes have been made, the client will be notified of any pending changes.
     *
     * @param resource The sync resource to listen to.
     * @param key The sync key, used to distinctly identify the requesting client.
     */
    startSyncListen(resource: string, key: string): any;
    /**
     * Update a given sync resource with new uids that's changed.
     * This should only be used for backend routines to notify the sync listeners of any update.
     *
     * Changes will be broadcasted immediately to exisiting clients,
     * and will be broadcasted to offline clients as soon as they connect.
     *
     * @param resource The sync resource to listen to.
     * @param uids The list of uids that have been updated.
     */
    updateSyncResource(resource: string, uids: string[]): any;
    /**
     * Acknowledges a list of UIDs that have been updated already,
     * so Unigraph can safely remove them from pending updates.
     *
     * You must call this method after you save the changes, for example,
     * Or you will get duplicate changes (although not with stale data) next time.
     *
     * @param resource The sync resource to listen to.
     * @param key The sync key, used to distinctly identify the requesting client.
     * @param uids The list of uids that have been synced successfully.
     */
    acknowledgeSync(resource: string, key: string, uids: any[]): any;
    /**
     * Updates client cache with given key and value.
     * Clients will be immediately notified of this cache update through websocket.
     *
     * @param key A string key to identify the cache
     * @param newValue Tne new value to set
     */
    updateClientCache?(key: string, newValue: any): any;
}
/** End of unigraph interface */ // Don't remove this line - needed for Monaco to work
