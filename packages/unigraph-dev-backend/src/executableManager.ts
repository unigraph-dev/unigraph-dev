/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

/**
 * This module contains functions that handle executables and their functionalities.
 */

import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { Unigraph } from 'unigraph-dev-common/lib/types/unigraph';

import cron from 'node-cron';

import _ from 'lodash';
import { PackageDeclaration } from 'unigraph-dev-common/lib/types/packages';
import Babel from '@babel/core';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { Executable, ExecContext, ExecRunner, runEnvLambdaJs } from 'unigraph-dev-common/lib/utils/executableUtils';
import { addHook } from './hooks';
import { Cache } from './caches';
import DgraphClient from './dgraphClient';
import { mergeWithConcatArray } from './utils';

export function createExecutableCache(
    client: DgraphClient,
    context: Partial<ExecContext>,
    unigraph: Unigraph,
    states: any,
): Cache<any> {
    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: 'manual',
        subscribe: (listener) => null,
    };

    cache.updateNow = async () => {
        states.lock.acquire('caches/exec', async (done: any) => {
            const newdata = await client.getExecutables();
            const newdata2 = await client.getSchemasFromTable();

            cache.data = newdata.reduce((prev, obj) => {
                obj = unpad(obj);
                if (obj && obj['unigraph.id']) {
                    prev[obj['unigraph.id']] = obj;
                }
                if (obj && obj.uid) {
                    prev[obj.uid] = obj;
                }
                return prev;
            }, {});

            Object.entries(newdata2).forEach(([k, v]) => {
                if (k.startsWith('$/executable') && !cache.data[k]) cache.data[k] = unpad(v);
            });

            done(false, null);
        });
    };

    cache.updateNow();

    return cache;
}

export function buildExecutable(exec: Executable, context: ExecContext, unigraph: Unigraph, states: any): any {
    function wrapExecutable(fn: any) {
        if (typeof fn === 'function') {
            // TODO: after using a proper logger, context.showConsole should give console.log for all children as well
            return async () => {
                const execId = getRandomInt();
                states.addRunningExecutable({
                    id: execId,
                    name: exec.name,
                    slug: exec['unigraph.id'],
                    since: new Date(),
                });
                const ret = await fn();
                states.removeRunningExecutable(execId);
                return ret;
            };
        }
        return fn;
    }
    if (
        Object.keys(environmentRunners).includes(exec.env) &&
        (!exec.concurrency ||
            states.runningExecutables.filter((el: any) => el.slug === exec['unigraph.id']).length < exec.concurrency)
    ) {
        return wrapExecutable(
            // @ts-expect-error: already checked for environment runner inclusion
            environmentRunners[exec.env](exec.src, context, unigraph),
        );
    }
    console.log('not a good executable - ', exec);
    return undefined;
}

export function initExecutables(
    executables: [string, Executable][],
    context: Partial<ExecContext>,
    unigraph: Unigraph,
    schedule: Record<string, cron.ScheduledTask>,
    states: any,
) {
    let newHooks = {};
    Object.values(schedule).forEach((el) => el?.stop());
    executables.forEach(([key, el]) => {
        if (key.startsWith('0x') && el.periodic) {
            schedule[el['unigraph.id']] = cron.schedule(el.periodic, () =>
                buildExecutable(el, { ...context, definition: el, params: {} }, unigraph, states)(),
            );
        }
        if (key.startsWith('0x') && el.on_hook) {
            newHooks = addHook(newHooks, el.on_hook, async (params: any) =>
                buildExecutable(el, { ...context, definition: el, params }, unigraph, states)(),
            );
        }
    });
    states.hooks = _.mergeWith({}, states.defaultHooks, newHooks, mergeWithConcatArray);
}

export const runEnvRoutineJs: ExecRunner = (src, context, unigraph) => {
    // const fn = () => eval(src);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = Object.getPrototypeOf(async () => false).constructor;
    const logs: any[] = [];
    const scopedConsole = context.showConsole
        ? {
              ...console,
              log: (...params: any[]) => {
                  console.log(...params);
                  logs.push(...params);
              },
          }
        : console;
    const fn = new AsyncFunction(
        'require',
        'unpad',
        'context',
        'unigraph',
        'console',
        'UnigraphObject',
        `try {${src}
} catch (e) {
        unigraph.addNotification({
            from: "Executable manager", 
            name: "Failed to run executable " + context.definition["unigraph.id"], 
            content: "Error was: " + e.toString() + e.stack }
        )
    }`,
    ).bind(this, require, unpad, context, unigraph, scopedConsole, UnigraphObject);

    return !context.showConsole
        ? fn
        : async () => ({
              _return: await fn(),
              _logs: logs,
          });
};

export const runEnvReactJSX: ExecRunner = (src, context, unigraph) => {
    let transpiled: any;
    try {
        transpiled = (
            require('@babel/core').transformSync(
                `function comp (params) {
${src}
}`,
                { presets: [require('@babel/preset-react')] },
            ) as any
        ).code;
    } catch (e: any) {
        unigraph.addNotification({
            from: 'Executable manager',
            name: `Failed to compile executable ${context.definition['unigraph.id']}`,
            content: `Error was: ${e.toString()}${e.stack}`,
        });
    }

    return transpiled;
};

const returnSrcFromEnvClientJs: ExecRunner = (src, context, unigraph) => src;

/** Environments */

export const environmentRunners = {
    'routine/js': runEnvRoutineJs,
    'lambda/js': runEnvLambdaJs,
    'component/react-jsx': runEnvReactJSX,
    'client/js': returnSrcFromEnvClientJs, // TODO: should we just forbid this in backend?
}; /** List of all environments supported in Unigraph */
