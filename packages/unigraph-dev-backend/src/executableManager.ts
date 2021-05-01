/**
 * This module contains functions that handle executables and their functionalities.
 */

import DgraphClient from "./dgraphClient";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { Cache } from './caches';
import { createContext } from "react";
import cron from 'node-cron';

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

export function createExecutableCache(client: DgraphClient): Cache<any> {
    
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

        initExecutables(Object.values(cache.data))
    };

    cache.updateNow();

    return cache;

}

export function buildExecutable(exec: Executable): any {
    if (Object.keys(environmentRunners).includes(exec.env)) {
        // @ts-expect-error: already checked for environment runner inclusion
        return environmentRunners[exec.env](exec.src);
    }
    return undefined;
}

export function initExecutables(executables: Executable[]) {
    executables.forEach(el => {
        if (el.periodic) cron.schedule(el.periodic, buildExecutable(el))
    })
}

/** Routines */

/**
 * A type of functions that "runs" the executable once. 
 */
export type ExecRunner = (src: string) => () => any;

export const runEnvRoutineJs: ExecRunner = (src) => {
    const fn = () => eval(src);

    return fn;
}

/** Environments */

export const environmentRunners = {"routine/js": runEnvRoutineJs} /** List of all environments supported in Unigraph */