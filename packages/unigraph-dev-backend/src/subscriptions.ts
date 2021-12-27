import _ from "lodash";
import { resourceLimits } from "worker_threads";
import { IWebsocket } from "./custom";
import DgraphClient, { queries } from "./dgraphClient";
import stringify from 'json-stable-stringify';
import {buildExecutable} from "./executableManager";
import {Query, QueryObject, QueryType} from 'unigraph-dev-common/lib/types/unigraph';
import { getRandomInt } from "unigraph-dev-common/lib/utils/utils";
import { makeQueryFragmentFromType } from "unigraph-dev-common/lib/utils/entityUtils";

export type Subscription = {
    data: any,
    query: Query, // something like () { uid }
    subType: "polling" | "pushing",
    callbackType: "function" | "messageid",
    id: number | string, // must be provided, regardless of using function or messageid
    /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
    function?: Function,
    msgPort?: IWebsocket,
    regTime: number, // time of registration, can be used to manually terminate subscription going too long
    connId?: string,
    clientId?: string,
    hibernated?: boolean,
    queryNow?: any,
    finalQuery?: any,
    queryTime?: number,
};

/**
 * Should get from executable (query.fragment is executable)
 * @param query 
 * @returns 
 */
export function getFragment(query: Query, states: any) {
    if (query.type === "query") {
        const eventId = getRandomInt();
        const frag = (query.options?.noExpand || query.fragment.startsWith('$/executable/')) ? query.fragment : `(func: uid(par${eventId})) @recurse {uid unigraph.id expand(_userpredicate_)}
        par${eventId} as var${query.fragment}`
        return frag;
    } else if (query.type === "type") {
        const {all, showHidden, uidsOnly, first, metadataOnly, depth, queryAs} = (query as QueryType).options!;
        const eventId = getRandomInt();
        const queryAny = queries.queryAny(eventId.toString(), uidsOnly)
        const queryAnyAll = queries.queryAnyAll(eventId.toString(), uidsOnly)
        const frag = query.name === "any" ? ((all || uidsOnly) ? queryAnyAll : queryAny) : `(func: uid(par${eventId})${first ? ", first: "+first : ""}) 
            @filter((type(Entity)) AND (NOT eq(<_propertyType>, "inheritance")) 
            ${ showHidden ? "" : "AND (NOT eq(<_hide>, true))" } AND (NOT type(Deleted)))
        ${uidsOnly ? "{ uid }" : (all ? "@recurse { uid <unigraph.id> expand(_userpredicate_) } " : (metadataOnly ? " { uid <dgraph.type> type { <unigraph.id> } } " : makeQueryFragmentFromType(query.name, states.caches["schemas"].data, depth)))}
        var(func: eq(<unigraph.id>, "${query.name}")) {
        <~type> {
        par${eventId} as uid
        }}`;
        return frag;
    } else if (query.type === "object") {
        let {uid, options} = query as Required<QueryObject>;
        if (typeof uid === "string" && uid.startsWith('$/')) {
            // Is named entity
            uid = states.namespaceMap[uid].uid;
        }
        const frag = options.queryFn ? options.queryFn.replace('QUERYFN_TEMPLATE', (Array.isArray(uid) ? uid.join(', ') : uid)) :`(func: uid(${Array.isArray(uid) ? uid.join(', ') : uid })) 
            ${options?.queryAsType ? makeQueryFragmentFromType(options.queryAsType, states.caches["schemas"].data, options?.depth) : "@recurse { uid unigraph.id expand(_userpredicate_) }"}`
        return frag;
    } else if (query.type === "group") {
        return ""
    } else return "";
}

export function buildPollingQuery(subs: Subscription[], states: any) {
    return subs.reduce((acc, now) => {return acc += `\n sub${now.id.toString()}` + getFragment(now.query, states)}, "{") + "}"
}

export type MsgCallbackFn = (id: number | string, updated: any, msgPort: IWebsocket, sub: Subscription) => any;

/**
 * Poll the database for subscription updates. Should be called by server roughly every 1 seconds (or more/less).
 * @param subs 
 * @param client 
 */
export async function pollSubscriptions(subs: Subscription[], client: DgraphClient, msgCallback: MsgCallbackFn, ids: any[] | undefined, serverStates: any) {
    if (!ids) ids = subs.map(el => el.id);
    if (subs.length >= 1) {
        subs.map(el => ids?.includes(el.id) ? el : false).forEach(async (el, index) => {
            if (el && !el.hibernated) {
                let query: string;
                if (getFragment(el.query, serverStates).startsWith("$/executable/")) {
                    const exec = serverStates.caches["executables"].data[getFragment(el.query, serverStates)];
                    const executed = await buildExecutable(exec, {"hello": "ranfromExecutable", params: (el as any).params || {}, definition: exec}, serverStates.localApi, serverStates)();
                    query = buildPollingQuery([{...el, query: {...el.query, type: "query", fragment: executed} as any}], serverStates)
                } else query = buildPollingQuery([el], serverStates);

                const queryFn = async () => {
                    el.queryNow = true;
                    const startTime = new Date().getTime();
                    let results: any[] = await client.queryDgraph(query).catch(e => {console.log(e, query); return []});
                    const val = results[0];
                    if (stringify(val) !== stringify(subs[index].data)) {
                        subs[index].data = val;
                        msgCallback(subs[index].id, val, subs[index].msgPort!, subs[index]);
                    }
                    el.queryNow = false;
                    el.queryTime = (new Date().getTime()) - startTime;
                    if (el.finalQuery) {
                        const fq = el.finalQuery;
                        el.finalQuery = false;
                        fq();
                    }
                }

                if (!el.queryNow) {
                    queryFn();
                } else {
                    el.finalQuery = queryFn;
                }
            }
        })
    }
}

export function createSubscriptionWS(id: string | number, msgPort: IWebsocket, query: Query, connId: string, clientId: string) {
    return {
        data: null,
        query: query,
        subType: "polling",
        callbackType: "messageid",
        id: id,
        msgPort: msgPort,
        regTime: new Date().getTime(),
        connId: connId,
        clientId: clientId,
    } as Subscription;
}

export function createSubscriptionLocal(id: string | number, callback: (data: any) => any, query: Query) {
    return {
        data: null,
        query: query,
        subType: "polling",
        callbackType: "function",
        id: id,
        function: callback,
        regTime: new Date().getTime()
    } as Subscription;
}

export function removeOrHibernateSubscriptionsById(subscriptions: Subscription[], connId: string, clientId: string | undefined) {
    if (!clientId) {
        return subscriptions.filter((it) => !(it.connId === connId))
    } else {
        return subscriptions.map((it) => {
            return {
                ...it,
                ...(it.clientId === clientId ? {hibernated: true} : {})
            }
        })
    }
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
        match: (oldQuery: QueryObject, newQuery: QueryObject) => (oldQuery.type === newQuery.type && (!newQuery.options || _.isEqual(oldQuery.options, newQuery.options))),
        resolve: async (oldQuery: QueryObject, newQuery: QueryObject, sub: Subscription, states: any) => {
            if (!newQuery.options) newQuery.options = oldQuery.options;
            const newUid = Array.isArray(newQuery.uid) ? newQuery.uid : [newQuery.uid];
            const oldUid = Array.isArray(oldQuery.uid) ? oldQuery.uid : [oldQuery.uid];
            const addUids = _.difference(newUid, oldUid);
            let newData = sub.data;
            if (addUids.length !== 0) {
                const query = `{ sub${getFragment({...newQuery, uid: addUids}, states)} }`;
                let results: any[] = await states.dgraphClient.queryDgraph(query).catch((e: any) => {console.log(e, query); return []});
                const addData = results[0] || [];
                newData = _.uniqBy([...sub.data, ...addData], "uid");
            }
            sub.data = newData.filter((el: any) => newUid?.includes(el?.['uid']));
            sub.query = newQuery;
            states.pollCallback(sub.id, sub.data, sub.msgPort!, sub);
        }
    }
}

export function resolveSubscriptionUpdate(subsId: number | string, newQuery: Query, states: any) {
    const sub = states.subscriptions.filter((el: Subscription) => el.id === subsId)?.[0]
    const oldQuery = sub?.query;
    console.log(oldQuery.options, (newQuery as any).options)
    if (!oldQuery) return false;
    const hasMatch = resolvers[newQuery.type].match(oldQuery, newQuery as any);
    if (!hasMatch) return false;

    // Resolve subscription update
    (resolvers[newQuery.type] as any).resolve(oldQuery, newQuery, sub, states);
}