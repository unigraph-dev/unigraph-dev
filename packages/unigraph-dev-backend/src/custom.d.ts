import { PackageDeclaration } from 'unigraph-dev-common/lib/types/packages';
import { Query, UnigraphNotification } from 'unigraph-dev-common/lib/types/unigraph';
import DgraphClient from './dgraphClient';

declare global {
    namespace Express {
        interface Request {
            dgraph: DgraphClient;
        }
    }
}

declare type UnigraphUpsert = {
    queries: string[];
    mutations: any[];
    appends: any[];
};

declare type Subscription = {
    data: any;
    query: Query; // something like () { uid }
    subType: 'polling' | 'pushing';
    callbackType: 'function' | 'messageid';
    id: number | string; // must be provided, regardless of using function or messageid
    /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
    function?: Function;
    msgPort?: IWebsocket;
    regTime: number; // time of registration, can be used to manually terminate subscription going too long
    connId?: string;
    clientId?: string;
    hibernated?: boolean;
    queryTime?: number;
    uids?: string[];
};

/**
 * Create a new schema using the json-ts format and add it to cache.
 *
 * Users should use `ensurePackage` and `ensureSchema` for applications.
 *
 * @param schema The schema to add to the current graph. Must be in the schema definition format.
 */
declare type EventCreateUnigraphSchema = {
    type: 'event';
    event: 'create_unigraph_schema';
    schema: Record<string, unknown> | Record<string, unknown>[];
    id: number;
};

declare type EventAddUnigraphPackage = {
    type: 'event';
    event: 'add_unigraph_package';
    id: number;
    package: PackageDeclaration;
    update: boolean;
};

declare type EventGetUnigraphObject = {
    type: 'event';
    event: 'get_unigraph_object';
    id: number;
    uid: string;
    options?: {
        queryAsType?: string | undefined;
    };
};

/**
 * Add an object to Unigraph. For more guidelines, see the overview docs folder.
 *
 * @param object The object to be added.
 * @param schema Schema of that object, must be valid. Such as: `$/schema/abc`
 * @param padded Whether the object is already in padded format (the Unigraph data model, with `_value` etc.)
 * @param subIds What subscriptions to update after the addition. If not set, all subscriptions will be updated.
 */
declare type EventCreateUnigraphObject = {
    type: 'event';
    event: 'create_unigraph_object';
    object: Record<string, unknown>;
    id: number;
    schema: string | undefined;
    padding: boolean | undefined;
    subIds: any[] | any;
    bulk: boolean | undefined;
};

/**
 * Updates objects simply using the SPO triplet format.
 *
 * @param triplets An array of triplets to update, in RDF format, such as [`<0x123> <_value> <0x456> .`]
 * @param isDelete Whether to consider the triplets as deletion. For example, the example triplet will
 * delete the link from `0x123` to `0x456` if `isDelete` is `true`.
 * @param subIds What subscriptions to update after the mutation. If not set, all subscriptions will be updated.
 */
declare type EventUpdateSPO = {
    type: 'event';
    event: 'update_spo';
    objects: string[];
    isDelete?: boolean;
    subIds: any[] | any;
    id: number;
};

/**
 * Deletes an object by its UID.
 *
 * @param uid The UID of the object to delete.
 * @param permanent Whether the deletion is permanent. If true, we will also remove all references, backlinks,
 * and annotations of the object. This process cannot be undone.
 */
declare type EventDeleteUnigraphObject = {
    type: 'event';
    event: 'delete_unigraph_object';
    id: number;
    uid: string;
    permanent?: boolean;
};

declare type EventCreateDataByJson = {
    type: 'event';
    event: 'create_data_by_json';
    id: number;
    data: Record<string, unknown>;
};

declare type EventSetDgraphSchema = {
    type: 'event';
    event: 'set_dgraph_schema';
    id: number;
    schema: string;
};

declare type EventQueryByStringWithVars = {
    type: 'event';
    event: 'query_by_string_with_vars';
    vars: Record<string, unknown>;
    query: string;
    id: number;
};

/**
 * Gets an object with the given UID or name from Unigraph.
 * If the object is updated, you will not be notified.
 *
 * @param uidOrName either the UID of the object or its name (such as `$/entity/example`).
 * @param options Options for the query.
 */
declare type EventGetObject = {
    type: 'event';
    event: 'get_object';
    id: number | string;
    uidOrName: string;
    connId: string;
    noExpand?: boolean;
    options?: {
        queryAsType: string | undefined;
    };
};

/**
 * Subscribe to a Unigraph object with a given UID or name, and call the callback function evry time the subscription is updated.
 *
 * @param uid UID of the unigraph object, of the format `0xabcd`; or a named entity starting with `$/`
 * @param eventId can be left empty - in this case, we will generate one for you,
 * but you cannot get the subscription elsewhere other than from callback.
 * @param options can be used to specify the query options.
 */
declare type EventSubscribeObject = {
    type: 'event';
    event: 'subscribe_to_object';
    id: number | string;
    uid: string;
    connId: string;
    noExpand?: boolean;
    options?: {
        queryAsType: string | undefined;
    };
};

/**
 * Subscribe to a Unigraph query and call the callback function evry time the subscription is updated.
 *
 * @param fragment DQL (GraphQL+-) Query fragment such as `(func: fn1(something)){ uid expand(_predicate_) }`
 * @param eventId can be left empty - in this case, we will generate one for you,
 * but you cannot get the subscription elsewhere other than from callback.
 * @param options can be used to specify the query options.
 */
declare type EventSubscribeQuery = {
    type: 'event';
    event: 'subscribe_to_query';
    id: number | string;
    queryFragment: string;
    connId: string;
    options?: { noExpand?: boolean };
};

/**
 * Subscribe to or update a Unigraph query (with the Query type).
 * @param query the query to subscribe to. Must follow the Query type (note this is different from a GraphQL query)
 * @param eventId subscription ID (if update, must be the same)
 * @param update whether we're updating the subscription (delta query).
 */
declare type EventSubscribe = {
    type: 'event';
    event: 'subscribe';
    id: number | string;
    query: Query;
    connId: string;
    update?: boolean;
};

/**
 * Hibernates (or revives) a Unigraph subscription.
 * @param eventId the subscription ID to (un)hibernate.
 * @param revival whether this is a revival or hibernation.
 */
declare type EventHibernateSubscription = {
    type: 'event';
    event: 'hibernate_or_revive_subscription';
    id: number | string;
    revival?: boolean;
    ids?: any;
};

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
declare type EventGetQueries = {
    type: 'event';
    event: 'get_queries';
    id: number | string;
    fragments: any[];
    getAll: boolean;
    batch: number;
    commonVars: string;
};

/**
 * Subscribes to a Unigraph type, and call the callback function every time the subscription is updated.
 *
 * @param name the type name. Can be `$/schema/`, `$/package/xxx/xxx/schema/` or `any` (subscribe to all objects).
 * @param eventId can be left empty - in this case, we will generate one for you,
 * but you cannot get the subscription elsewhere other than from callback.
 * @param options can be used to specify the query options.
 */
declare type EventSubscribeType = {
    type: 'event';
    event: 'subscribe_to_type';
    id: number | string;
    schema: string;
    connId: string;
    options?: {
        all?: boolean;
        showHidden?: boolean;
        uidsOnly?: boolean;
    };
};

declare type EventUnsubscribeById = {
    type: 'event';
    event: 'unsubscribe_by_id';
    id: number | string;
};

declare interface IWebsocket {
    /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
    send: Function;
    readyState: number;
}

/**
 * Checks if Unigraph server has the schema with the given name.
 *
 * If not, create the schema defined in `fallback` instead.
 *
 * @param name the schema name, starting with `$/schema/`
 * @param fallback the fallback schema, with the json-ts format.
 */
declare type EventEnsureUnigraphSchema = {
    type: 'event';
    event: 'ensure_unigraph_schema';
    id: number;
    name: string;
    fallback: any;
};

/**
 * Checks if Unigraph server has the package with the given name.
 *
 * If not, create the package defined in `fallback` instead.
 *
 * @param packageName the unique package name, such as `unigraph.core`.
 * You can also attach a version number, such as `unigraph.core@0.0.1`.
 * @param fallback the fallback schema with the `PackageDeclaration` format.
 */
declare type EventEnsureUnigraphPackage = {
    type: 'event';
    event: 'ensure_unigraph_package';
    id: number;
    packageName: string;
    fallback: PackageDeclaration;
};

declare type EventGetSchemas = {
    type: 'event';
    event: 'get_schemas';
    id: number;
    schemas: string[];
    resolve: boolean;
};

declare type EventGetPackages = {
    type: 'event';
    event: 'get_packages';
    id: number;
    packages: string[];
};

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
declare type EventUpdateObject = {
    type: 'event';
    event: 'update_object';
    id: number;
    uid: string;
    newObject: any;
    upsert: boolean | undefined;
    pad: boolean | undefined;
    subIds?: any[] | any;
    origin?: any[];
    usedUids?: any[];
};

declare type EventDeleteRelation = {
    type: 'event';
    event: 'delete_relation';
    id: number;
    uid: string;
    relation: any;
};

/**
 * Deletes an item from an array (ordered list).
 *
 * @param uid The uid of the target list - must be of type `$/composer/Array`
 * @param item Either the UID (outer) or the index of an item, or an array of such items.
 * @param relationUid Optional. Specifies the uid of the entity this array belongs to. If present, entity relation to it will also be deleted.
 * @param subIds Optional, either an ID or an array of ID with relevant subscriptions. If not set, all subscriptions will be updated.
 */
declare type EventDeleteItemFromArray = {
    type: 'event';
    event: 'delete_item_from_array';
    id: number;
    uid: string;
    item: any;
    relUid?: string;
    subIds: any[] | any;
};

/**
 * Reorders items in an array (ordered list).
 * @param uid The uid of the target list - must be of type `$/composer/Array`
 * @param item an array of an array of 2 items, first being the original index(es) or uid, second being the desired index(es).
 * @param relationUid Optional. Specifies the uid of the entity this array belongs to. If present, entity relation to it will also be deleted.
 * @param subIds Optional, either an ID or an array of ID with relevant subscriptions. If not set, all subscriptions will be updated.
 */
declare type EventReorderItemInArray = {
    type: 'event';
    event: 'reorder_item_in_array';
    id: number;
    uid: string;
    item: any;
    relUid?: string;
    subIds: any[] | any;
};

declare type EventResponser = (event: any, ws: IWebsocket, connId?: any) => any;

declare type EventProxyFetch = {
    type: 'event';
    event: 'proxy_fetch';
    id: number;
    url: string;
    options?: Record<string, any>;
};

declare type EventImportObjects = {
    type: 'event';
    event: 'import_objects';
    id: number;
    objects: string;
};

/**
 * Runs an executable with the given global ID and parameters.
 *
 * @param uid The global executable id of the form `$/package/xxx/xxx/executable/abc`, or simply a database-wide UID.
 * You can use the global function `getExecutableId` to find it.
 * @param params The parameters defined for that executable.
 */
declare type EventRunExecutable = {
    type: 'event';
    event: 'run_executable';
    id: number;
    uid: string;
    params: any;
    bypassCache?: boolean;
    context?: any;
};

/**
 * Adds a notification to the global notification list.
 *
 * @param item Of type UnigraphNotification: `{from: "<sender>", name: "<title>", content: "<content>"}`
 */
declare type EventAddNotification = {
    type: 'event';
    event: 'add_notification';
    id: number;
    item: UnigraphNotification;
};

/**
 * Gets search results given a search query.
 *
 * @param query A string of the desired query. Such as: `minecraft memes`. The query will be stemmed and searched similar to a search engine.
 * @param method A string describing what kind of search to perform. Default is 'fulltext'
 * @param display How to return the results to display. 'indexes' will only fetch the indexes.
 * @param hops How many hops to fetch.
 * @param searchOptions Options for the search query.
 */
declare type EventGetSearchResults = {
    type: 'event';
    event: 'get_search_results';
    id: number;
    query: string;
    method: string;
    display?: string;
    hops?: number;
    searchOptions: any;
    limit?: number;
    noPrimitives?: boolean;
};

/**
 * Exports a list of specified objects into a JSON file.
 * @param uids The list of objects in a UID string array
 * @param options Options for export
 */
declare type EventExportObjects = {
    type: 'event';
    event: 'export_objects';
    id: number;
    uids: string[];
    options: any;
};

declare type EventGetSubscriptions = {
    type: 'event';
    event: 'get_subscriptions';
    id: number;
};

/**
 * Changes last edited time of an object/objects.
 * @param uids uids of objects to change.
 */
declare type EventTouch = {
    type: 'event';
    event: 'touch';
    id: number;
    uids: string[] | string;
};

declare type EventDisablePackage = {
    type: 'event';
    event: 'disable_package';
    packageName: string;
    id: number;
};

declare type EventEnablePackage = {
    type: 'event';
    event: 'enable_package';
    packageName: string;
    id: number;
};

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
declare type EventRecalculateBacklinks = {
    type: 'event';
    event: 'recalculate_backlinks';
    id: number;
    fromUids: string[];
    toUids: string[];
    depth?: number;
};

/**
 * Adds a list of fromUids (parents) to backlinks (unigraph.origin) of toUids (children).
 * @param fromUids A list of objects to fetch.
 * @param toUids
 */
declare type EventAddBacklinks = {
    type: 'event';
    event: 'add_backlinks';
    id: number;
    fromUids: string[];
    toUids: string[];
};

declare type EventStartSyncListen = {
    type: 'event';
    event: 'start_sync_listen';
    id: number;
    resource: string;
    key: string;
};

declare type EventUpdateSyncResource = {
    type: 'event';
    event: 'update_sync_resource';
    id: number;
    resource: string;
    uids: string[];
};

declare type EventAcknowledgeSync = {
    type: 'event';
    event: 'acknowledge_sync';
    id: number;
    resource: string;
    key: string;
    uids: string[];
};
