/**
 * This module contains functions that handle executables and their functionalities.
 */

import DgraphClient from "./dgraphClient";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { Unigraph } from "unigraph-dev-common/lib/types/unigraph";
import { Cache } from './caches';

import cron from 'node-cron';

import _ from "lodash";
import { PackageDeclaration } from "unigraph-dev-common/lib/types/packages";
import { addHook } from "./hooks";
import Babel from '@babel/core';
import { getRandomInt } from "unigraph-dev-common/lib/utils/utils";

export type Executable = {
    name?: string,
    "unigraph.id": string,
    src: string,
    env: string,
    periodic?: string,
    on_hook?: string,
    editable?: boolean,
    edited?: boolean,
    children?: any
}

export function createExecutableCache(client: DgraphClient, context: Partial<ExecContext>, unigraph: Unigraph, states: any): Cache<any> {
    
    const schedule: Record<string, cron.ScheduledTask> = {};
    
    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: "manual",
        subscribe: (listener) => null
    };

    cache.updateNow = async () => { 
        const newdata = await client.getExecutables();
        const newdata2 = await client.getSchemasFromTable();
        
        cache.data = newdata.reduce((prev, obj) => {
            obj = unpad(obj);
            if (obj && obj["unigraph.id"]) {
                prev[obj["unigraph.id"]] = obj;
            }
            if (obj && obj.uid) {
                prev[obj.uid] = obj;
            }
            return prev;
        }, {})

        Object.entries(newdata2).forEach(([k, v]) => {
            if (k.startsWith('$/executable') && !cache.data[k]) cache.data[k] = unpad(v);
        })
        
        initExecutables(Object.entries(cache.data), context, unigraph, schedule, states)
    };

    cache.updateNow();

    return cache;

}

export function buildExecutable(exec: Executable, context: ExecContext, unigraph: Unigraph, states: any): any {

    function wrapExecutable (fn: any) {
        if (typeof fn === "function") return async () => {
            const execId = getRandomInt();
            states.addRunningExecutable({
                id: execId,
                name: exec.name,
                slug: exec["unigraph.id"],
                since: new Date()
            });
            const ret = await fn();
            states.removeRunningExecutable(execId)
            return ret;
        }; else return fn;
    }

    if (Object.keys(environmentRunners).includes(exec.env)) {
        // @ts-expect-error: already checked for environment runner inclusion
        return wrapExecutable(environmentRunners[exec.env](exec.src, context, unigraph));
    }
    return undefined;
}

export function initExecutables(executables: [string, Executable][], context: Partial<ExecContext>, unigraph: Unigraph, schedule: Record<string, cron.ScheduledTask>, states: any) {
    executables.forEach(([key, el]) => {
        if (key.startsWith("0x") && el.periodic) {
            schedule[el["unigraph.id"]]?.stop();
            schedule[el["unigraph.id"]] = cron.schedule(el.periodic, buildExecutable(el, {...context, definition: el, params: {}}, unigraph, states))
        }
        if (key.startsWith("0x") && el.on_hook) {
            states.hooks = addHook(states.hooks, el.on_hook, async (params: any) => {
                return (buildExecutable(el, {...context, definition: el, params}, unigraph, states))();
            })
        }
    })
}

/** Routines */

export type ExecContext = {
    /** Input parameters in the form of an object */
    params: any;
    /** Package declaration */
    package?: PackageDeclaration;
    /** Definition of the executable */
    definition: Executable;
    /** A function that send events */
    send?: any
    [x: string]: any 
}

/**
 * A type of functions that "runs" the executable once. 
 * Takes the necessary contexts and returns a paramless function that executes ther executable when called.
 */
export type ExecRunner = (src: string, context: ExecContext, unigraph: Unigraph) => (() => any) | string;

export const runEnvRoutineJs: ExecRunner = (src, context, unigraph) => {
    //const fn = () => eval(src);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const fn = new AsyncFunction("require", "unpad", "context", "unigraph", `try {${src}
} catch (e) {
        unigraph.addNotification({
            from: "Executable manager", 
            name: "Failed to run executable " + context.definition["unigraph.id"], 
            content: "Error was: " + e.toString() + e.stack }
        )
    }`).bind(this, require, unpad, context, unigraph);

    

    return fn;
}

export const runEnvLambdaJs: ExecRunner = (src, context, unigraph) => {
    //const fn = () => eval(src);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const fn = new AsyncFunction("require", "unpad", "context", "unigraph", `try {
        return ${src}
} catch (e) {
        unigraph.addNotification({
            from: "Executable manager", 
            name: "Failed to run executable " + context.definition["unigraph.id"], 
            content: "Error was: " + e.toString() + e.stack }
        )
    }`).bind(this, require, unpad, context, unigraph);

    

    return fn;
}

export const runEnvReactJSX: ExecRunner = (src, context, unigraph) => {
    let transpiled: any;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        transpiled = (require("@babel/core").transformSync(`function comp (params) {
${src}
}`, {presets: [require("@babel/preset-react")]}) as any).code;
    } catch (e) {
        unigraph.addNotification({
            from: "Executable manager", 
            name: "Failed to compile executable " + context.definition["unigraph.id"], 
            content: "Error was: " + e.toString() + e.stack }
        )
    }
    
    return transpiled;
}

export const runEnvClientJs: ExecRunner = (src, context, unigraph) => {
    return src;
}

/** Environments */

export const environmentRunners = {
    "routine/js": runEnvRoutineJs,
    "lambda/js": runEnvLambdaJs,
    "component/react-jsx": runEnvReactJSX,
    "client/js": runEnvClientJs,
} /** List of all environments supported in Unigraph */

