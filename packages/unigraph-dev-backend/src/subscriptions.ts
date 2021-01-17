import _ from "lodash";
import { IWebsocket } from "./custom";
import DgraphClient from "./dgraphClient";

export type Subscription = {
    data: any,
    queryFragment: string, // something like () { uid }
    subType: "polling" | "pushing",
    callbackType: "function" | "messageid",
    id: number | string, // must be provided, regardless of using function or messageid
    function?: Function,
    msgPort?: IWebsocket,
    regTime: number // time of registration, can be used to manually terminate subscription going too long
};

export function buildPollingQuery(subs: Subscription[]) {
    return subs.reduce((acc, now) => {return acc += `\n sub${now.id.toString()}` + now.queryFragment}, "{") + "}"
};

export type MsgCallbackFn = (id: number | string, updated: any, msgPort: IWebsocket) => any;

/**
 * Poll the database for subscription updates. Should be called by server roughly every 1 seconds (or more/less).
 * @param subs 
 * @param client 
 */
export async function pollSubscriptions(subs: Subscription[], client: DgraphClient, msgCallback: MsgCallbackFn) {
    if (subs.length >= 1) {
        let query = buildPollingQuery(subs);
        let results: any[] = await client.queryDgraph(query);
        results.forEach((val, id) => { // FIXME: Beware race conditions
            if (!_.isEqual(val, subs[id].data) && subs[id].msgPort) {
                subs[id].data = val;
                msgCallback(subs[id].id, val, subs[id].msgPort!);
            }
        })
    }
}

export function createSubscriptionWS(id: string | number, msgPort: IWebsocket, queryFragment: string) {
    return {
        data: null,
        queryFragment: queryFragment,
        subType: "polling",
        callbackType: "messageid",
        id: id,
        msgPort: msgPort,
        regTime: new Date().getTime(),
    } as Subscription;
}