import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";

export const maxDateStamp = 8640000000000000;
export const getMinDate = () => new Date(0);
export const getMaxDate = () => new Date(maxDateStamp);
export const setHours = (date: Date, h: number, m: number, s: number, ms: number) => {
    if (!date.getHours() && !date.getMinutes() && !date.getSeconds() && !date.getMilliseconds()) date.setHours(h, m, s, ms);
    return date
}



export type ATodoList = {
    uid?: string,
    name: string | any,
    done: boolean,
    priority: number,
    semantic_properties: {
        children: any[]
    },
    time_frame?: {
        start: Date,
        end: Date
    }
}

export const filterFns = {
    "no-filter": (objs: any[]) => objs,
    "only-incomplete": (objs: any[]) => objs.filter(obj => {
        let r;
        try {r = unpad(obj)['done'] === false}
        catch (e) {r=false};
        return r;
    }),
    "only-complete": (objs: any[]) => objs.filter(obj => {
        let r;
        try {r = unpad(obj)['done'] === true}
        catch (e) {r=false};
        return r;
    }),
    "high-priority": (objs: any[]) => objs.filter(obj => {
        let r;
        try {r = unpad(obj)['priority'] >= 1}
        catch (e) {r=false};
        return r;
    })
}