/* eslint-disable no-nested-ternary */
import _ from 'lodash';
import stringify from 'json-stable-stringify';
import { Query, QueryObject, QueryType } from 'unigraph-dev-common/lib/types/unigraph';
import { buildGraph, getCircularReplacer, getRandomId, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { makeQueryFragmentFromType } from 'unigraph-dev-common/lib/utils/entityUtils';
import { buildExecutable } from './executableManager';
import DgraphClient, { queries } from './dgraphClient';
import { IWebsocket, Subscription } from './custom.d';

/**
 * Should get from executable (query.fragment is executable)
 * @param query
 * @returns
 */
export function getFragment(query: Query, states: any) {
    if (query.type === 'query') {
        const eventId = getRandomInt();
        const frag =
            query.options?.noExpand || query.fragment.startsWith('$/executable/')
                ? query.fragment
                : `(func: uid(par${eventId})) @recurse {uid unigraph.id expand(_userpredicate_)}
        par${eventId} as var${query.fragment}`;
        return frag;
    }
    if (query.type === 'type') {
        const { all, showHidden, uidsOnly, first, metadataOnly, depth, queryAs } = (query as QueryType).options!;
        const eventId = getRandomInt();
        const queryAny = queries.queryAny(eventId.toString(), uidsOnly);
        const queryAnyAll = queries.queryAnyAll(eventId.toString(), uidsOnly);
        const frag =
            query.name === 'any'
                ? all || uidsOnly
                    ? queryAnyAll
                    : queryAny
                : `(func: uid(par${eventId})${first ? `, first: ${first}` : ''}) 
            @filter((type(Entity)) AND (NOT eq(<_propertyType>, "inheritance")) 
            ${showHidden ? '' : 'AND (NOT eq(<_hide>, true))'} AND (NOT type(Deleted)))
        ${
            uidsOnly
                ? '{ uid }'
                : all
                ? '@recurse { uid <unigraph.id> expand(_userpredicate_) } '
                : metadataOnly
                ? ' { uid <dgraph.type> type { <unigraph.id> } _updatedAt _createdAt _hide } '
                : queryAs || makeQueryFragmentFromType(query.name, states.caches.schemas.data, depth)
        }
        var(func: eq(<unigraph.id>, "${query.name}")) {
        <~type> {
        par${eventId} as uid
        }}`;
        return frag;
    }
    if (query.type === 'object') {
        // eslint-disable-next-line prefer-const
        let { uid, options } = query as Required<QueryObject>;
        if (typeof uid === 'string' && uid.startsWith('$/')) {
            // Is named entity
            uid = states.namespaceMap[uid].uid;
        } else if (Array.isArray(uid)) {
            uid = uid.map((u: any) => (typeof u === 'string' && u.startsWith('$/') ? states.namespaceMap[u].uid : u));
        }
        const queryBody = options?.queryAsType
            ? makeQueryFragmentFromType(options.queryAsType, states.caches.schemas.data, options?.depth)
            : `@recurse${
                  options?.depth ? `(depth: ${options?.depth})` : ''
              } { uid unigraph.id expand(_userpredicate_) }`;
        const frag = options.queryFn
            ? options.queryFn.replace('QUERYFN_TEMPLATE', Array.isArray(uid) ? uid.join(', ') : uid)
            : `(func: uid(${Array.isArray(uid) ? uid.join(', ') : uid})) 
            ${queryBody}`;
        return frag;
    }
    if (query.type === 'group') {
        return '';
    }
    return '';
}

export function buildPollingQuery(subs: { id: any; query: any }[], states: any) {
    return `${subs.reduce((acc, now) => {
        // eslint-disable-next-line no-param-reassign
        acc += `\n sub${now.id.toString()}${getFragment(now.query, states)}`;
        return acc;
    }, '{')} }`;
}

export type MsgCallbackFn = (updated: any, sub: Subscription, ofUpdate?: number | string) => any;

export type MergedSubscription = {
    subscriptions: Subscription[];
    aggregateQuery: Query;
    resolver: (updated: any, ofUpdate?: any) => void;
};

export function mergeSubscriptions(
    toMerge: Subscription[],
    msgCallback: MsgCallbackFn,
    ids?: any[],
    states?: any,
): MergedSubscription[] {
    function callbackIfChanged(updated: any, sub: Subscription, ofUpdate: any) {
        if (
            stringify(updated, { replacer: getCircularReplacer() }) !==
            stringify(sub.data, { replacer: getCircularReplacer() })
        ) {
            sub.data = updated;
            msgCallback(updated, sub, ofUpdate);
        }
    }

    // First, group by query type
    const typeQueries = toMerge.filter((el) => el.query.type === 'type' && !el.hibernated);
    const objectQueries = toMerge.filter((el) => el.query.type === 'object' && !el.hibernated);
    const queryQueries = toMerge.filter((el) => el.query.type === 'query' && !el.hibernated);

    // Next, group by different kinds of fragments for each
    const totalMerged: MergedSubscription[] = [];

    // query queries: must be the same query
    const groupsQueryQueries: Record<string, [Query, Subscription[]]> = {};
    queryQueries.forEach((el: Subscription) => {
        const key = `${(el.query as any)?.fragment}${(el.query as any)?.options?.noExpand}`;
        if (!groupsQueryQueries[key]) {
            groupsQueryQueries[key] = [el.query, [el]];
        } else {
            groupsQueryQueries[key][1].push(el);
        }
    });
    Object.values(groupsQueryQueries)
        .filter(([query, subs]) => subs.filter((sub) => ids?.includes(sub.id)).length >= 1)
        .forEach(([query, subs]) => {
            totalMerged.push({
                subscriptions: subs,
                aggregateQuery: query,
                resolver: (updated: any, ofUpdate: any) => {
                    subs.forEach((el) => {
                        callbackIfChanged(updated, el, ofUpdate);
                    });
                },
            });
        });

    // type queries: both type names and options must be equal
    const groupsTypeQueries: Record<string, [Query, Subscription[]]> = {};
    typeQueries.forEach((el: Subscription) => {
        const key = `${JSON.stringify((el.query as any)?.name)}${stringify((el.query as any)?.options)}`;
        if (!groupsTypeQueries[key]) {
            groupsTypeQueries[key] = [el.query, [el]];
        } else {
            groupsTypeQueries[key][1].push(el);
        }
    });
    Object.values(groupsTypeQueries)
        .filter(([query, subs]) => subs.filter((sub) => ids?.includes(sub.id)).length >= 1)
        .forEach(([query, subs]) => {
            totalMerged.push({
                subscriptions: subs,
                aggregateQuery: query,
                resolver: (updated: any, ofUpdate: any) => {
                    subs.forEach((el) => {
                        callbackIfChanged(updated, el, ofUpdate);
                    });
                },
            });
        });

    // object queries: options must be equal
    const groupsObjectQueries: Record<string, [QueryObject, Subscription[]]> = {};
    objectQueries.forEach((el: Subscription) => {
        const key = `${stringify((el.query as any)?.options)}`;
        if (!groupsObjectQueries[key]) {
            groupsObjectQueries[key] = [JSON.parse(JSON.stringify(el.query)), [el]];
            if (!Array.isArray(groupsObjectQueries[key][0].uid)) {
                // @ts-expect-error: already checking for uids
                groupsObjectQueries[key][0].uid = [groupsObjectQueries[key][0].uid];
            }
        } else {
            const thisUid = Array.isArray((el.query as any)?.uid) ? (el.query as any)?.uid : [(el.query as any)?.uid];
            groupsObjectQueries[key][0].uid = _.uniq([...groupsObjectQueries[key][0].uid, ...thisUid]);
            groupsObjectQueries[key][1].push(el);
        }
    });
    Object.values(groupsObjectQueries)
        .map((el) => {
            const totalUids = _.uniq(
                el[1]
                    .filter((sub) => ids?.includes(sub.id))
                    .map((sub) =>
                        Array.isArray((sub.query as any)?.uid) ? (sub.query as any)?.uid : [(sub.query as any)?.uid],
                    )
                    .flat(),
            );
            el[0].uid = totalUids;
            return el;
        })
        .forEach(([query, subs]) => {
            totalMerged.push({
                subscriptions: subs,
                aggregateQuery: query,
                resolver: (updated: any, ofUpdate: any) => {
                    const startTime = new Date().getTime();
                    buildGraph(updated);
                    const graphTime = new Date().getTime() - startTime;
                    if (graphTime > 5) console.log(`Build graph took ${graphTime}ms, which is a bit slow`);
                    subs.forEach((el) => {
                        const uidResolver = (uu: string) => (uu.startsWith('$/') ? states.namespaceMap[uu].uid : uu);
                        const allUids = (el.query as QueryObject).uid;
                        const resolvedUid = Array.isArray(allUids) ? allUids.map(uidResolver) : uidResolver(allUids);
                        const updatedIts = updated.filter((it: any) => {
                            return resolvedUid && (resolvedUid === it.uid || resolvedUid.includes(it.uid));
                        });
                        if (
                            updatedIts.length !==
                            (Array.isArray((el.query as QueryObject).uid) ? (el.query as QueryObject).uid.length : 1)
                        )
                            return;
                        callbackIfChanged(updatedIts, el, ofUpdate);
                    });
                },
            });
        });

    return totalMerged;
}

/**
 * Poll the database for subscription updates. Should be called by server roughly every 1 seconds (or more/less).
 * @param subs
 * @param client
 */
export async function pollSubscriptions(
    subs: Subscription[],
    client: DgraphClient,
    msgCallback: MsgCallbackFn,
    ids: any[] | undefined,
    serverStates: any,
    ofUpdate?: any,
) {
    if (!ids) ids = subs.map((el) => el.id);
    const mergedSubs = mergeSubscriptions(subs.filter(Boolean), msgCallback, ids, serverStates);
    // console.log(JSON.stringify(mergedSubs, null, 4));
    mergedSubs.forEach(async (el, index) => {
        let query: string;
        if (getFragment(el.aggregateQuery, serverStates).startsWith('$/executable/')) {
            const exec = serverStates.caches.executables.data[getFragment(el.aggregateQuery, serverStates)];
            const executed = await buildExecutable(
                exec,
                {
                    hello: 'ranfromExecutable',
                    params: (el as any).params || {},
                    definition: exec,
                },
                serverStates.localApi,
                serverStates,
            )();
            query = buildPollingQuery(
                [
                    {
                        id: getRandomId(),
                        query: {
                            ...el.aggregateQuery,
                            type: 'query',
                            fragment: executed,
                        } as any,
                    },
                ],
                serverStates,
            );
        } else query = buildPollingQuery([{ query: el.aggregateQuery, id: getRandomId() }], serverStates);
        try {
            // const startTime = new Date().getTime();
            const results: any[] = await client.queryDgraph(query);
            const val = results[0];
            el.resolver(val, ofUpdate);
            // el.queryTime = new Date().getTime() - startTime;
        } catch (e) {
            console.log(e, query);
        }
    });
}

export function createSubscriptionWS(
    id: string | number,
    msgPort: IWebsocket,
    query: Query,
    connId: string,
    clientId: string,
) {
    return {
        data: null,
        query,
        subType: 'polling',
        callbackType: 'messageid',
        id,
        msgPort,
        regTime: new Date().getTime(),
        connId,
        clientId,
    } as Subscription;
}

export function createSubscriptionLocal(id: string | number, callback: (data: any) => any, query: Query) {
    return {
        data: null,
        query,
        subType: 'polling',
        callbackType: 'function',
        id,
        function: callback,
        regTime: new Date().getTime(),
    } as Subscription;
}

export function removeOrHibernateSubscriptionsById(
    subscriptions: Subscription[],
    connId: string,
    clientId: string | undefined,
) {
    if (!clientId) {
        return subscriptions.filter((it) => !(it.connId === connId));
    }
    return subscriptions.map((it) => ({
        ...it,
        ...(it.clientId === clientId ? { hibernated: true } : {}),
    }));
}

export function reviveSubscriptions(subscriptions: Subscription[], connId: string, clientId: string, newMsgPort: any) {
    const newData = {
        msgPort: newMsgPort,
        connId,
        clientId,
        hibernated: false,
    };
    return subscriptions.map((el) => (el.connId === connId ? { ...el, ...newData } : el));
}

const resolvers = {
    type: {
        match: () => false,
    },
    query: {
        match: () => false,
    },
    group: {
        match: () => false,
    },
    object: {
        match: (oldQuery: QueryObject, newQuery: QueryObject) =>
            oldQuery.type === newQuery.type && (!newQuery.options || _.isEqual(oldQuery.options, newQuery.options)),
        resolve: async (oldQuery: QueryObject, newQuery: QueryObject, sub: Subscription, states: any) => {
            if (!newQuery.options) newQuery.options = oldQuery.options;
            const newUid = Array.isArray(newQuery.uid) ? newQuery.uid : [newQuery.uid];
            const oldUid = Array.isArray(oldQuery.uid) ? oldQuery.uid : [oldQuery.uid];
            const addUids = _.difference(newUid, oldUid);
            let newData = sub.data || [];
            if (addUids.length !== 0) {
                const query = `{ sub${getFragment({ ...newQuery, uid: addUids }, states)} }`;
                const results: any[] = await states.dgraphClient.queryDgraph(query).catch((e: any) => {
                    console.log(e, query);
                    return [];
                });
                const addData = results[0] || [];
                newData = _.uniqBy([...(sub.data || []), ...addData], 'uid');
            }
            sub.data = newData.filter((el: any) => newUid?.includes(el?.uid));
            sub.query = newQuery;
            states.pollCallback(sub.data, sub);
        },
    },
};

export function resolveSubscriptionUpdate(subsId: number | string, newQuery: Query, states: any) {
    const sub = states.subscriptions.filter((el: Subscription) => el.id === subsId)?.[0];
    const oldQuery = sub?.query;
    // console.log(oldQuery.options, (newQuery as any).options);
    if (!oldQuery) return false;
    const hasMatch = resolvers[newQuery.type].match(oldQuery, newQuery as any);
    if (!hasMatch) return false;

    // Resolve subscription update
    return (resolvers[newQuery.type] as any).resolve(oldQuery, newQuery, sub, states);
}
