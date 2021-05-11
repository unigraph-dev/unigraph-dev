/**
 * This module contains functions that handle executables and their functionalities.
 */

import DgraphClient from "./dgraphClient";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { Unigraph } from "unigraph-dev-common/lib/types/unigraph";
import { Cache } from './caches';

import cron from 'node-cron';

import _ from "lodash";

export type Executable = {
    name?: string,
    "unigraph.id": string,
    src: string,
    env: string,
    periodic?: string,
    editable?: boolean,
    edited?: boolean,
    semantic_properties?: any
}

export function createExecutableCache(client: DgraphClient, context: ExecContext, unigraph: Unigraph): Cache<any> {
    
    const schedule: Record<string, cron.ScheduledTask> = {};
    
    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: "manual",
        subscribe: (listener) => null
    };

    cache.updateNow = async () => { 
        const newdata = await client.getExecutables();
        cache.data = newdata.reduce((prev, obj) => {
            obj = unpad(obj);
            if (obj && obj["unigraph.id"]) {
                prev[obj["unigraph.id"]] = obj;
            }
            return prev;
        }, {})
        
        initExecutables(Object.values(cache.data), context, unigraph, schedule)
    };

    cache.updateNow();

    return cache;

}

export function buildExecutable(exec: Executable, context: ExecContext, unigraph: Unigraph): any {
    if (Object.keys(environmentRunners).includes(exec.env)) {
        // @ts-expect-error: already checked for environment runner inclusion
        return environmentRunners[exec.env](exec.src, context, unigraph);
    }
    return undefined;
}

export function initExecutables(executables: Executable[], context: ExecContext, unigraph: Unigraph, schedule: Record<string, cron.ScheduledTask>) {
    executables.forEach(el => {
        if (el.periodic) {
            schedule[el["unigraph.id"]]?.stop();
            schedule[el["unigraph.id"]] = cron.schedule(el.periodic, buildExecutable(el, context, unigraph))
        }
    })
}

/** Routines */

export type ExecContext = {
    // TODO: add context specifications
}

/**
 * A type of functions that "runs" the executable once. 
 */
export type ExecRunner = (src: string, context: ExecContext, unigraph: Unigraph) => () => any;

export const runEnvRoutineJs: ExecRunner = (src, context, unigraph) => {
    //const fn = () => eval(src);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const fn = new AsyncFunction("require", "unpad", "context", "unigraph", src).bind(this, require, unpad, context, unigraph);

    return fn;
}

/** Environments */

export const environmentRunners = {"routine/js": runEnvRoutineJs} /** List of all environments supported in Unigraph */

