import _ from "lodash";
import { resourceLimits } from "worker_threads";
import { IWebsocket } from "./custom";
import DgraphClient from "./dgraphClient";
import stringify from 'json-stable-stringify';
import {buildExecutable} from "./executableManager";

export type Subscription = {
    data: any,
    queryFragment: string, // something like () { uid }
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
};

export function buildPollingQuery(subs: Subscription[]) {
    return subs.reduce((acc, now) => {return acc += `\n sub${now.id.toString()}` + now.queryFragment}, "{") + "}"
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
                if (el.queryFragment.startsWith("$/executable/")) {
                    const exec = serverStates.caches["executables"].data[el.queryFragment];
                    const executed = await buildExecutable(exec, {"hello": "ranfromExecutable", params: (el as any).params || {}, definition: exec}, serverStates.localApi, serverStates)();
                    query = buildPollingQuery([{...el, queryFragment: executed}])
                } else query = buildPollingQuery([el]);

                const queryFn = async () => {
                    let results: any[] = await client.queryDgraph(query).catch(e => {console.log(e, query); return []});
                    el.queryNow = true;
                    const val = results[0];
                    if (stringify(val) !== stringify(subs[index].data)) {
                        subs[index].data = val;
                        msgCallback(subs[index].id, val, subs[index].msgPort!, subs[index]);
                    }
                    el.queryNow = false;
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

export function createSubscriptionWS(id: string | number, msgPort: IWebsocket, queryFragment: string, connId: string, clientId: string) {
    return {
        data: null,
        queryFragment: queryFragment,
        subType: "polling",
        callbackType: "messageid",
        id: id,
        msgPort: msgPort,
        regTime: new Date().getTime(),
        connId: connId,
        clientId: clientId,
    } as Subscription;
}

export function createSubscriptionLocal(id: string | number, callback: (data: any) => any, queryFragment: string) {
    return {
        data: null,
        queryFragment: queryFragment,
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