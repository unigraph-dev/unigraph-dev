/* eslint-disable prefer-destructuring */
import { Application } from 'express-ws';
import express from 'express';
import WebSocket from 'ws';
import { isJsonString, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { insertsToUpsert } from 'unigraph-dev-common/lib/utils/txnWrapper';
import {
    buildUnigraphEntity,
    processAutoref,
    dectxObjects,
    processAutorefUnigraphId,
} from 'unigraph-dev-common/lib/utils/entityUtils';
import repl from 'repl';
import fetch from 'node-fetch';
import _, { uniqueId } from 'lodash';
import { Unigraph } from 'unigraph-dev-common/lib/types/unigraph';
import stringify from 'json-stable-stringify';
import DgraphClient from './dgraphClient';
import {
    EventAddNotification,
    EventAddUnigraphPackage,
    EventCreateDataByJson,
    EventCreateUnigraphObject,
    EventCreateUnigraphSchema,
    EventDeleteItemFromArray,
    EventDeleteRelation,
    EventDeleteUnigraphObject,
    EventEnsureUnigraphPackage,
    EventEnsureUnigraphSchema,
    EventExportObjects,
    EventGetPackages,
    EventGetQueries,
    EventGetSchemas,
    EventGetSearchResults,
    EventGetSubscriptions,
    EventHibernateSubscription,
    EventImportObjects,
    EventProxyFetch,
    EventQueryByStringWithVars,
    EventReorderItemInArray,
    EventResponser,
    EventRunExecutable,
    EventSetDgraphSchema,
    EventSubscribe,
    EventSubscribeObject,
    EventSubscribeQuery,
    EventSubscribeType,
    EventTouch,
    EventUnsubscribeById,
    EventUpdateObject,
    EventUpdateSPO,
    IWebsocket,
    Subscription,
    UnigraphUpsert,
} from './custom.d';
import {
    addUnigraphPackage,
    checkOrCreateDefaultDataModel,
    createPackageCache,
    createSchemaCache,
} from './datamodelManager';
import { Cache } from './caches';
import {
    createSubscriptionLocal,
    MsgCallbackFn,
    pollSubscriptions,
    removeOrHibernateSubscriptionsById,
    reviveSubscriptions,
} from './subscriptions';
import {
    afterObjectCreatedHooks,
    callHooks,
    HookAfterObjectChangedParams,
    HookAfterSchemaUpdatedParams,
    HookAfterSubscriptionAddedParams,
    Hooks,
    initEntityHeads,
} from './hooks';
import { getAsyncLock } from './asyncManager';
import { createExecutableCache } from './executableManager';
import { getLocalUnigraphAPI } from './localUnigraphApi';
import { addNotification } from './notifications';
import { perfLogAfterDbTransaction, perfLogStartDbTransaction, perfLogStartPreprocessing } from './logging';

const PORT = 3001;
const PORT_HTTP = 4001;
const verbose = 5;

export default async function startServer(client: DgraphClient) {
    let app: Application;
    const dgraphClient = client;

    const pollInterval = 20000;

    const caches: Record<string, Cache<any>> = {};
    const _subscriptions: Subscription[] = [];

    const lock = getAsyncLock();

    const connections: Record<string, WebSocket> = {};

    // Basic checks
    await checkOrCreateDefaultDataModel(client);

    // Initialize subscriptions
    const pollCallback: MsgCallbackFn = (id, newdata, msgPort, sub, ofUpdate) => {
        if (sub?.callbackType === 'messageid') {
            if (msgPort.readyState === 1) {
                msgPort.send(
                    stringify({
                        type: 'subscription',
                        updated: true,
                        id,
                        result: newdata,
                        ofUpdate,
                    }),
                );
            }
        } else if (sub?.callbackType === 'function' && sub.function) {
            sub.function(newdata);
        }
    };

    const serverStates: any = {};

    function leaseToClient(connId: any) {
        const lease = serverStates.leasedUids.splice(0, 128);
        if (!serverStates.clientLeasedUids[connId]) serverStates.clientLeasedUids[connId] = [];
        serverStates.clientLeasedUids[connId].push(...lease);
    }

    const checkLeasedUid = async () => {
        if (serverStates?.leasedUids?.length < 8192) {
            const lease = await dgraphClient.leaseUids(8192);
            for (let i = parseInt(lease.startId, 10); i < parseInt(lease.endId, 10); i += 1) {
                serverStates.leasedUids.push(`0x${i.toString(16)}`);
            }
        }
        Object.entries(connections).forEach(([connId, el]) => {
            if (serverStates.clientLeasedUids[connId]?.length < 128) {
                leaseToClient(connId);
            }
            if (serverStates.clientLeasedUids[connId]?.length)
                el.send(
                    stringify({
                        type: 'cache_updated',
                        name: 'uid_lease',
                        result: serverStates.clientLeasedUids[connId],
                    }),
                );
        });
    };

    const hooks: Hooks = {
        after_subscription_added: [
            async (context: HookAfterSubscriptionAddedParams) => {
                pollSubscriptions(context.subscriptions, dgraphClient, pollCallback, context.ids, serverStates);
            },
        ],
        after_schema_updated: [
            async (context: HookAfterSchemaUpdatedParams) => {
                await context.caches.schemas.updateNow();
                await context.caches.packages.updateNow();
                await context.caches.executables.updateNow();
                Object.values(connections).forEach((el) =>
                    el.send(
                        stringify({
                            type: 'cache_updated',
                            name: 'schemaMap',
                            result: serverStates.caches.schemas.data,
                        }),
                    ),
                );
            },
        ],
        after_object_changed: [
            async (context: HookAfterObjectChangedParams) => {
                if (context.subIds && !Array.isArray(context.subIds)) context.subIds = [context.subIds];
                pollSubscriptions(
                    context.subscriptions,
                    dgraphClient,
                    pollCallback,
                    context.subIds,
                    serverStates,
                    context.ofUpdate,
                );
                await context.caches.executables.updateNow();

                // Call after_object_created hooks with uids cached
                const objectCreatedHooks: any = {};
                Object.keys(serverStates.hooks).forEach((el) => {
                    if (el.startsWith('after_object_created/')) {
                        const schemaName = el.replace('after_object_created/', '$/schema/');
                        objectCreatedHooks[schemaName] = serverStates.hooks[el];
                    }
                });
                lock.acquire('caches/head', async (done: any) => {
                    await afterObjectCreatedHooks(serverStates, objectCreatedHooks, client);
                    done(false, null);
                });

                checkLeasedUid();
            },
        ],
    };

    let namespaceMap: any = {};
    let debounceId: NodeJS.Timeout;

    Object.assign(serverStates, {
        caches,
        subscriptions: _subscriptions,
        dgraphClient,
        hooks,
        defaultHooks: hooks,
        namespaceMap,
        localApi: {} as Unigraph,
        lock,
        leasedUids: [],
        clientLeasedUids: {},
        httpCallbacks: {},
        runningExecutables: [],
        addRunningExecutable: (defn: any) => {
            serverStates.runningExecutables.push(defn);
            clearTimeout(debounceId);
            debounceId = setTimeout(() => {
                Object.values(connections).forEach((el) => {
                    el.send(
                        stringify({
                            type: 'cache_updated',
                            name: 'runningExecutables',
                            result: serverStates.runningExecutables,
                        }),
                    );
                });
            }, 250);
        },
        removeRunningExecutable: (id: any) => {
            serverStates.runningExecutables = serverStates.runningExecutables.filter((el: any) => el.id !== id);
            clearTimeout(debounceId);
            debounceId = setTimeout(() => {
                Object.values(connections).forEach((el) => {
                    el.send(
                        stringify({
                            type: 'cache_updated',
                            name: 'runningExecutables',
                            result: serverStates.runningExecutables,
                        }),
                    );
                });
            }, 250);
        },
        entityHeadByType: {},
        pollCallback,
    });

    await checkLeasedUid();

    const namespaceSub = createSubscriptionLocal(
        getRandomInt(),
        (data) => {
            namespaceMap = data[0];
            serverStates.namespaceMap = data[0];
            Object.values(connections).forEach((el) => {
                el.send(
                    stringify({
                        type: 'cache_updated',
                        name: 'namespaceMap',
                        result: data[0],
                    }),
                );
            });
        },
        {
            type: 'query',
            options: { noExpand: true },
            fragment: `(func: eq(<unigraph.id>, "$/meta/namespace_map")) {
            uid
            <unigraph.id>
            _name
            _icon
            expand(_userpredicate_) {
            uid
            <unigraph.id>
            _name
            _icon
            <_value[> {
                uid
                <unigraph.id>
                _name
                _icon
            }
            }
        }`,
        },
    );

    serverStates.subscriptions.push(namespaceSub);
    await pollSubscriptions(serverStates.subscriptions, dgraphClient, pollCallback, undefined, serverStates);

    // Initialize caches
    caches.schemas = createSchemaCache(client);
    caches.packages = createPackageCache(client);
    const localApi = getLocalUnigraphAPI(client, serverStates);
    serverStates.localApi = localApi;
    caches.executables = createExecutableCache(client, { hello: 'world' }, localApi, serverStates);

    setInterval(() => {
        pollSubscriptions(serverStates.subscriptions, dgraphClient, pollCallback, undefined, serverStates);
        checkLeasedUid();
    }, pollInterval);

    const makeResponse = (event: { id: number | string }, success: boolean, body: Record<string, unknown> = {}) =>
        stringify({
            type: 'response',
            success,
            id: event.id,
            ...body,
        });

    const eventRouter: Record<string, EventResponser> = {
        query_by_string_with_vars(event: EventQueryByStringWithVars, ws: IWebsocket) {
            dgraphClient
                .queryData<any[]>(event.query, event.vars)
                .then((res) => {
                    ws.send(makeResponse(event, true, { result: res }));
                })
                .catch((e) => ws.send(makeResponse(event, false, { error: e.toString() })));
        },

        set_dgraph_schema(event: EventSetDgraphSchema, ws: IWebsocket) {
            dgraphClient
                .setSchema(event.schema)
                .then((res) => {
                    ws.send(makeResponse(event, true));
                })
                .catch((e) => ws.send(makeResponse(event, false, { error: e.toString() })));
        },

        create_data_by_json(event: EventCreateDataByJson, ws: IWebsocket) {
            dgraphClient
                .createData(event.data)
                .then((res) => {
                    callHooks(serverStates.hooks, 'after_object_changed', {
                        subscriptions: serverStates.subscriptions,
                        caches,
                        ofUpdate: event.id,
                    });
                    ws.send(makeResponse(event, true));
                })
                .catch((e) => ws.send(makeResponse(event, false, { error: e.toString() })));
        },

        subscribe_to_object(event: EventSubscribeObject, ws: IWebsocket) {
            serverStates.localApi
                .subscribeToObject(event.uid, { ws, connId: event.connId }, event.id, event.options || {})
                .then((res: any) => ws.send(makeResponse(event, true)));
        },

        get_object(event: EventSubscribeObject, ws: IWebsocket) {
            serverStates.localApi
                .getObject(event.uid, { ws, connId: event.connId }, event.id, event.options || {})
                .then((res: any) => ws.send(makeResponse(event, true, { result: res })));
        },

        subscribe_to_type(event: EventSubscribeType, ws: IWebsocket) {
            lock.acquire('caches/schema', (done: any) => {
                done(false);
                serverStates.localApi
                    .subscribeToType(event.schema, { ws, connId: event.connId }, event.id, event.options || {})
                    .then((res: any) => ws.send(makeResponse(event, true)))
                    .catch((e: any) => ws.send(makeResponse(event, false, { error: e.toString() })));
            });
        },

        async subscribe_to_query(event: EventSubscribeQuery, ws: IWebsocket) {
            serverStates.localApi
                .subscribeToQuery(event.queryFragment, { ws, connId: event.connId }, event.id, event.options)
                .then((res: any) => ws.send(makeResponse(event, true)))
                .catch((e: any) => ws.send(makeResponse(event, false, { error: e.toString() })));
        },

        async subscribe(event: EventSubscribe, ws: IWebsocket) {
            serverStates.localApi
                .subscribe(event.query, { ws, connId: event.connId }, event.id, event.update)
                .then((res: any) => ws.send(makeResponse(event, true)))
                .catch((e: any) => ws.send(makeResponse(event, false, { error: e.toString() })));
        },

        async get_queries(event: EventGetQueries, ws: IWebsocket) {
            const results = await localApi
                .getQueries(event.fragments)
                .catch((e: any) => ws.send(makeResponse(event, false, { error: e })));
            ws.send(makeResponse(event, true, { results }));
        },

        unsubscribe_by_id(event: EventUnsubscribeById, ws: IWebsocket) {
            localApi.unsubscribe(event.id as any);
            ws.send(makeResponse(event, true));
        },

        ensure_unigraph_schema(event: EventEnsureUnigraphSchema, ws: IWebsocket) {
            const names = Object.keys(caches.schemas.data);
            if (names.includes(event.name)) {
                ws.send(makeResponse(event, true));
            } else {
                // Falls back to create nonexistent schema
                eventRouter.create_unigraph_schema({ ...event, schema: event.fallback }, ws);
            }
        },

        /**
         * Creates unigraph schema entity(s) in dgraph.
         * @param event The event for creating the schema
         * @param ws Websocket connection
         */
        create_unigraph_schema(event: EventCreateUnigraphSchema, ws: IWebsocket) {
            /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
            lock.acquire('caches/schema', function (done: Function) {
                const schema = event.schema;
                const schemaAutoref = processAutorefUnigraphId(schema);
                const upsert: UnigraphUpsert = insertsToUpsert([schemaAutoref], undefined, serverStates.caches['schemas'].dataAlt![0]);
                dgraphClient.createUnigraphUpsert(upsert).then(async _ => {
                await callHooks(serverStates.hooks, "after_schema_updated", {caches: caches});
                ws.send(makeResponse(event, true));
                done(false, null)
                }).catch(e => {ws.send(makeResponse(event, false, {"error": e.toString()})); done(true, null)});
            })
        },

        "ensure_unigraph_package": function (event: EventEnsureUnigraphPackage, ws: IWebsocket) {
            lock.acquire('caches/schema', function(done: Function) {
                const names = Object.keys(caches["packages"].data);
                if (names.includes(event.packageName)) {
                ws.send(makeResponse(event, true));
                done(false, null);
                } else {
                // Falls back to add package
                const eventb: any = {...event, package: event.fallback};
                addUnigraphPackage(dgraphClient, eventb.package, caches).then(async _ => {
                    await callHooks(serverStates.hooks, "after_schema_updated", {caches: caches});
                    done(false, null)
                    //console.log("Hooks called")
                    ws.send(makeResponse(eventb, true));
                }).catch(e => {ws.send(makeResponse(eventb, false, {"error": e.toString()})); done(true, null)});
                }
            })
        },

        "add_unigraph_package": function (event: EventAddUnigraphPackage, ws: IWebsocket) {
            lock.acquire('caches/schema', function(done: Function) {
                addUnigraphPackage(dgraphClient, event.package, serverStates.caches, event.update).then(async _ => {
                await callHooks(serverStates.hooks, "after_schema_updated", {caches: caches});
                done(false, null)
                //console.log("Hooks called")
                ws.send(makeResponse(event, true));
                }).catch(e => {ws.send(makeResponse(event, false, {"error": e.toString()})); console.error(e); done(true, null)});
            })
        },

        "delete_unigraph_object": async function (event: EventDeleteUnigraphObject, ws: IWebsocket) {
            await localApi.deleteObject(event.uid, event.permanent).catch((e: any) => ws.send(makeResponse(event, false, {error: e})));
        },

        /**
         * Creates one unigraph object entity in dgraph.
         * 
         * Basically the procedure is like [Build padded entity based on schema and object] =>
         * [Do autoref checks based on schema] => [Convert to upsert if we're using Dgraph as backend]
         * 
         * @param event The event for creating the object
         * @param ws Websocket connection
         */
        "create_unigraph_object": function (event: EventCreateUnigraphObject, ws: IWebsocket) {
            if (!event.schema) { ws.send(makeResponse(event, false, {"error": "Cannot add Unigraph object without a schema!"})); return false; }
            localApi.addObject(event.object, event.schema, event.padding).then((uids: any[]) => {
                ws.send(makeResponse(event, true, {results: uids}))
            }).catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
        },

        "update_spo": function (event: EventUpdateSPO, ws: IWebsocket) {
            localApi.updateTriplets(event.objects).then((_: any) => {
                callHooks(serverStates.hooks, "after_object_changed", {subscriptions: serverStates.subscriptions, caches: caches, ofUpdate: event.id})
                ws.send(makeResponse(event, true))
            }).catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
        },

        /**
         * Updates an object given its uid and new object.
         * 
         * There are two methods of update: using or not using upsert.
         * This choice is represented in the "upsert" property of the event.
         * If upsert is false, Unigraph will NOT care about whatever currently in object and overwrite;
         * In upsert false mode, non-specified fields will be dereferenced, but not deleted. 
         * You can use "$upsert": true to identify which part to use upsert; Note that this cannot be nested in a upsert=false object.
         *
         * @param event The event for update. Detailed options for the event is outlined above.
         * @param ws Websocket connection
         */
        "update_object": async function (event: EventUpdateObject, ws: IWebsocket) {
            perfLogStartPreprocessing();
            const newUid = event.uid ? event.uid : event.newObject.uid
            // Get new object's unigraph.origin first
            let origin;
            if (!event.origin) {
                origin = event.newObject['unigraph.origin'] ? event.newObject['unigraph.origin'] : (await dgraphClient.queryData<any>(`query { entity(func: uid(${newUid})) { <unigraph.origin> { uid }}}`, []))[0]?.['unigraph.origin']
                if (!Array.isArray(origin)) origin = [origin];
            } else origin = event.origin;
            if (typeof event.upsert === "boolean" && !event.upsert) {
                if (event.pad) { 
                ws.send(makeResponse(event, false, {"error": "In non-upsert mode, you have to supply a padded object, since we are mutating metadata explicitly as well."})) 
                } else {
                let newObject = {...event.newObject, uid: newUid, 'unigraph.origin': origin}; // If specifying UID, override with it
                let autorefObject = processAutorefUnigraphId(newObject);
                const upsert = insertsToUpsert([autorefObject], false, serverStates.caches['schemas'].dataAlt![0]);
                perfLogStartDbTransaction();
                
                dgraphClient.createUnigraphUpsert(upsert).then(res => {
                    perfLogAfterDbTransaction();
                    if (event.usedUids) {
                        serverStates.leasedUids = _.difference(serverStates.leasedUids, event.usedUids)
                        Object.entries(serverStates.clientLeasedUids).forEach(([connId, el]: any[]) => {
                            serverStates.clientLeasedUids[connId] = _.difference(el, event.usedUids as any[]);
                        })
                    };
                    callHooks(serverStates.hooks, "after_object_changed", {subscriptions: serverStates.subscriptions, caches: caches, subIds: event.subIds, ofUpdate: event.id})
                    ws.send(makeResponse(event, true))
                }).catch(e => ws.send(makeResponse(event, false, {"error": e.toString()})));
                
                }
            } else { // upsert mode
                let finalUpdater: any;
                if (event.pad !== false) {
                const origObject = (await dgraphClient.queryUID(event.uid))[0];
                const schema = origObject['type']['unigraph.id'];
                const paddedUpdater = buildUnigraphEntity(event.newObject, schema, caches['schemas'].data, true, {validateSchema: true, isUpdate: true, states: {}, globalStates: {}});
                finalUpdater = processAutoref({...paddedUpdater, uid: event.uid, 'unigraph.origin': origin}, schema, caches['schemas'].data);
                //console.log(upsert);
                console.log(JSON.stringify(finalUpdater, null, 4))
                } else {
                const updater = {...event.newObject, uid: event.uid ? event.uid : event.newObject.uid, 'unigraph.origin': origin};
                finalUpdater = processAutorefUnigraphId(updater);
                }

                const finalUpsert = insertsToUpsert([finalUpdater], undefined, serverStates.caches['schemas'].dataAlt![0]);
                
                dgraphClient.createUnigraphUpsert(finalUpsert).then(_ => {
                    callHooks(serverStates.hooks, "after_object_changed", {subscriptions: serverStates.subscriptions, caches: caches, subIds: event.subIds, ofUpdate: event.id})
                    ws.send(makeResponse(event, true))
                }).catch(e => ws.send(makeResponse(event, false, {"error": e.toString()})));
                
            }
        },

        "delete_relation": async function (event: EventDeleteRelation, ws: IWebsocket) {
            localApi.deleteRelation(event.uid, event.relation).then(() => {
                ws.send(makeResponse(event, true))
            }).catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
        },

        "reorder_item_in_array": async function (event: EventReorderItemInArray, ws: IWebsocket) {
            (localApi as any).reorderItemInArray(event.uid, event.item, event.relUid, event.subIds).then((_: any) => {
                ws.send(makeResponse(event, true))
            }).catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
        },

        "delete_item_from_array": async function (event: EventDeleteItemFromArray, ws: IWebsocket) {
            localApi.deleteItemFromArray(event.uid, event.item, event.relUid, event.subIds).then((_: any) => {
                ws.send(makeResponse(event, true))
            }).catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
        },

        "get_status": async function (event: any, ws: IWebsocket) {
            const status = {
                "dgraph": await dgraphClient.getStatus(),
                "unigraph": {
                "cache": {
                    "length": Object.values(caches).length,
                    "names": Object.keys(caches),
                },
                "subscription": {
                    "length": serverStates.subscriptions.length,
                }
                }
            }
            ws.send(makeResponse(event, true, status))
        },

        "get_schemas": async function (event: EventGetSchemas, ws: IWebsocket) {
            // TODO: Option to get only a couple of schemas in cache
            const schemas = await serverStates.localApi.getSchemas(event.schemas, event.resolve);
            ws.send(makeResponse(event, true, {"schemas": schemas}));
        },

        "get_packages": async function (event: EventGetPackages, ws: IWebsocket) {
            // TODO: Option to get only a couple of schemas in cache
            ws.send(makeResponse(event, true, {"packages": caches['packages'].data}));
        },

        "proxy_fetch": async function (event: EventProxyFetch, ws: IWebsocket) {
            // TODO: Using node-fetch here for now; if we move to deno later we can replace it.
            // https://stackoverflow.com/questions/54099802/blob-to-base64-in-nodejs-without-filereader
            if (verbose >= 2) console.log('yo2')
            fetch(event.url, event.options)
                .then(res => res.buffer())
                .then(buffer => ws.send(makeResponse(event, true, {"blob": buffer.toString('base64')})))
                .catch(err => ws.send(makeResponse(event, false, {error: err})))
        },

        "hibernate_or_revive_subscription": async function (event: EventHibernateSubscription, ws: IWebsocket) {
            const res = await serverStates.localApi.hibernateOrReviveSubscription(event.ids || event.id, event.revival)
                .catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
            ws.send(makeResponse(event, true, {result: res}))
        },

        "import_objects": async function (event: EventImportObjects, ws: IWebsocket) {
            const parsed = JSON.parse(event.objects);
            const dectx_raw: any[] = JSON.parse(JSON.stringify(dectxObjects(parsed)));
            const dectx: any[] = dectx_raw.filter(el => !(el['dgraph.type']?.includes('Executable') || el['dgraph.type']?.includes('Named')))
            const ref = dectx.map((el, index) => {
                try {
                return processAutorefUnigraphId(JSON.parse(JSON.stringify(el)));
                } catch (e) {
                if (Object.keys(el).length <= 2 && el.uid) {
                    return undefined;
                } else {
                    console.error(el, index)
                    throw e;
                }
                }
            }).filter(el => el !== undefined);
            const fs = require('fs');
            fs.writeFileSync('imports_log.json', JSON.stringify(ref));
            const upsert = insertsToUpsert(ref, undefined, serverStates.caches['schemas'].dataAlt![0]);
            dgraphClient.createUnigraphUpsert(upsert).then(_ => {
                callHooks(serverStates.hooks, "after_object_changed", {subscriptions: serverStates.subscriptions, caches: caches, ofUpdate: event.id})
                ws.send(makeResponse(event, true))
                }).catch(e => ws.send(makeResponse(event, false, {"error": e.toString()})));
            },

            "run_executable": async function (event: EventRunExecutable, ws: IWebsocket) {
                localApi.runExecutable(event.uid, event.params, {send: (it: string) => {ws.send(it)}}, undefined, event.bypassCache)
                    .then((ret: any) => ws.send(makeResponse(event, true, {returns: ret})));
        },

        /* Userspace methods: eventually, users can install apps that extend their own methods into here. */

        "add_notification": async function (event: EventAddNotification, ws: IWebsocket) {
            await addNotification(event.item, caches, dgraphClient).catch(e => ws.send(makeResponse(event, false, {error: e})));
            callHooks(serverStates.hooks, "after_object_changed", {subscriptions: serverStates.subscriptions, caches: caches, ofUpdate: event.id});
            ws.send(makeResponse(event, true));
        },

        "get_search_results": async function (event: EventGetSearchResults, ws: IWebsocket) {
            let searchQuery: any = event.query;
            let searchOptions: any = event.searchOptions;
            if (event.method === "fulltext") {
                // using compatibility mode for full text query
                searchQuery = [{method: 'fulltext', value: event.query}];
                searchOptions = {
                    ...searchOptions,
                    limit: event.limit ? "-" + event.limit : undefined,
                    noPrimitives: event.noPrimitives
                }
            }
            serverStates.localApi.getSearchResults(searchQuery, event.display, event.hops, searchOptions)
                .then((res: any) => ws.send(makeResponse(event, true, { results: res })))
                .catch((e: any) => ws.send(makeResponse(event, false, { "error": e.toString() })));
        },

        "export_objects": async function (event: EventExportObjects, ws: IWebsocket) {
            const res = await serverStates.localApi.exportObjects(event.uids, event.options)
                .catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
            ws.send(makeResponse(event, true, {result: res}))
        },

        "get_subscriptions": async function (event: EventGetSubscriptions, ws: IWebsocket) {
            const res = serverStates.localApi.getSubscriptions();
            ws.send(makeResponse(event, true, {result: res}))
        },

        "touch": async function (event: EventTouch, ws: IWebsocket) {
            const res = await serverStates.localApi.touch(event.uids)
                .catch((e: any) => ws.send(makeResponse(event, false, {"error": e.toString()})));
            ws.send(makeResponse(event, true, {result: res}))
        },

        "lease_uid": function (event: any, ws: IWebsocket, connId) {
            serverStates.clientLeasedUids[connId] = _.difference(serverStates.clientLeasedUids[connId], [event.uid]);
            checkLeasedUid();
        }
    };

    await Promise.all(Object.values(caches).map((el: Cache<any>) => el.updateNow()));

    initEntityHeads(serverStates, Object.keys(serverStates.caches['schemas'].data).filter(el => el.startsWith('$/schema/')), client);

    const server = new WebSocket.Server({
        port: PORT,
        perMessageDeflate: true
    })

    server.on('listening', (server: any) => {
        console.log('\nUnigraph server listening on port', PORT);
    })

    /** Maps from clientIds to connIds, from this server start  */
    const historialClients: Record<string, string> = {}
    serverStates.getClientId = (connId: string) => Object.entries(historialClients).filter(el => el[1] === connId)?.[0]?.[0] || getRandomInt();

    server.on('connection', (ws, req) => {
        // Set up connId and clientId
        let connId = uniqueId();
        let revival = false;
        connections[connId] = ws;
        const clientBrowserId = (new URL(req.url || "/", 'https://localhost')).searchParams.get('browserId') || connId;
        if (!Object.keys(historialClients).includes(clientBrowserId) || !(new URL(req.url || "/", 'https://localhost')).searchParams.get('revival')) {
            if (Object.keys(historialClients).includes(clientBrowserId)) {
                serverStates.subscriptions = removeOrHibernateSubscriptionsById(serverStates.subscriptions, historialClients[clientBrowserId], undefined);
            }
            historialClients[clientBrowserId] = connId;
        } else {
            connId = historialClients[clientBrowserId];
            revival = true
        }
        
        ws.on('message', (msg: string) => {
            const msgObject: {type: string | null, event: string | null} = isJsonString(msg)
            if (msgObject) {
                // match events
                if (msgObject.type === "event" && msgObject.event && eventRouter[msgObject.event]) {
                    if (verbose >= 1 && !["run_executable", "get_subscriptions"].includes(msgObject.event)) 
                        console.log("Event: " + msgObject.event + ", from: " + clientBrowserId + " | " + connId);
                    eventRouter[msgObject.event]({...msgObject, connId: connId}, ws, connId);
                }
                if (verbose >= 6) console.log(msgObject);
            } else {
                console.log("Message received is not JSON!");
                console.log(msg)
            }
        });
        ws.on('close', () => {
            serverStates.subscriptions = removeOrHibernateSubscriptionsById(serverStates.subscriptions, connId, clientBrowserId);
            delete connections[connId];
            if (verbose >= 1) console.log("Connection closed: " + connId);
            serverStates.leasedUids.push(...(serverStates.clientLeasedUids[connId] || []));
            delete serverStates.clientLeasedUids[connId];
        })
        ws.send(stringify({
            "type": "cache_updated",
            "name": "namespaceMap",
            result: serverStates.namespaceMap
        }))
        ws.send(stringify({
            "type": "cache_updated",
            "name": "schemaMap",
            result: serverStates.caches['schemas'].data
        }))
        leaseToClient(connId);
        ws.send(stringify({
            type: 'cache_updated',
            name: 'uid_lease',
            result: serverStates.clientLeasedUids[connId],
        }))
        console.log('opened socket connection');

        checkLeasedUid();

        if (revival) {
            serverStates.subscriptions = reviveSubscriptions(serverStates.subscriptions, historialClients[clientBrowserId], clientBrowserId, ws)
            pollSubscriptions(serverStates.subscriptions.filter((el: any) => el.clientId === clientBrowserId),
                dgraphClient, pollCallback, undefined, serverStates);
        }
    })

    const httpserver = express()

    Object.entries(eventRouter).forEach(([key, fn]) => {
        httpserver.get('/' + key, (req, res) => {
        console.log(req.query)
        fn(req.query, res as any);
        })
    })

    httpserver.get('/', (req, res) => {
        res.send(`<!DOCTYPE HTML><head></head><body>${Object.entries(eventRouter).map(el => el[0] + "<br>")}</body>`)
    })

    httpserver.get('/callback', (req, res) => {
        if (typeof req.query.key === 'string' && Object.keys(serverStates.httpCallbacks).includes(req.query.key)) {
            serverStates.httpCallbacks[req.query.key]({headers: req.headers, body: req.body, query: req.query});
            res.send("Complete callback!");
            delete serverStates.httpCallbacks[req.query.key];
        } else res.send("No callback!")
    })

    httpserver.listen(PORT_HTTP);

    const debugServer = repl.start("unigraph> ");
    // @ts-ignore /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
    debugServer.context.unigraph = {caches: caches, dgraphClient: client, server: server, subscriptions: serverStates.subscriptions, localApi: localApi, serverStates: serverStates};

    return [app!, server] as const;
}