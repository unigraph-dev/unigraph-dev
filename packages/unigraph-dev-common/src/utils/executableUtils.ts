import _ from 'lodash/fp';
import { Unigraph } from '../types/unigraph';
import { unpad } from './entityUtils';
import { ExecContext } from '../types/executableTypes';
import { getRandomInt } from './utils';

/**
 * A type of functions that "runs" the executable once.
 * Takes the necessary contexts and returns a paramless function that executes ther executable when called.
 */

export type ExecRunner = (
    src: string,
    context: ExecContext,
    unigraph: Unigraph<WebSocket | undefined>,
) => (() => any) | string;

export const runEnvLambdaJs: ExecRunner = (src, context, unigraph) => {
    // const fn = () => eval(src);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = Object.getPrototypeOf(async () => false).constructor;
    const fn = new AsyncFunction(
        'require',
        'unpad',
        'context',
        'unigraph',
        'console',
        `try {
        return ${src}
        } catch (e) {
                unigraph.addNotification({
                    from: "Executable manager", 
                    name: "Failed to run executable " + context.definition["unigraph.id"], 
                    content: "Error was: " + e.toString() + e.stack }
                )
            }`,
    ).bind(this, require, unpad, context, unigraph, console);

    // Ignoring async lambdas for now
    // return async () => await fn();
    return () => fn();
};

export const runEnvClientJs: ExecRunner = (src, context, unigraph) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = eval('Object.getPrototypeOf(async function () {}).constructor');
    const fn = new AsyncFunction(
        'require',
        'unpad',
        'context',
        'unigraph',
        `try {${src}
    } catch (e) {
            unigraph.addNotification({
                from: "Executable manager", 
                name: "Failed to run executable",
                content: "Error was: " + e.toString() + e.stack }
            )
    }`,
    ).bind(this, require, unpad, context, unigraph);
    // Ignoring async client executables for now
    // return async () => await fn();
    return () => fn();
};

export const environmentRunners = {
    'lambda/js': runEnvLambdaJs,
    'client/js': runEnvClientJs,
}; /** List of all environments supported in Unigraph */

export function buildExecutableForClient(
    exec: any, // exec here is a unigraph object, not unpadded
    // exec: Executable,
    context: ExecContext,
    unigraph: Unigraph<WebSocket | undefined>,
    states: any,
): any {
    function wrapExecutable(fn: any) {
        if (typeof fn === 'function') {
            // Ignoring async client executables for now
            return () => {
                // return async () => {
                const execId = getRandomInt();
                const newExecEntry = {
                    id: execId,
                    name: exec.name,
                    slug: exec['unigraph.id'],
                    since: new Date(),
                };
                const runningExecutablesState = unigraph.getState('registry/runningExecutables');
                // add the new entry to the registry
                runningExecutablesState.setValue([...runningExecutablesState.value, newExecEntry]);
                // Ignoring async client executables for now
                const ret = fn();
                // const ret = await fn();
                // remove the entry from the registry
                runningExecutablesState.setValue(runningExecutablesState.value.filter((el: any) => el.id !== execId));
                console.log('execution finished', {
                    runningExecutables: unigraph.getState('registry/runningExecutables').value,
                });
                return ret;
            };
        }
        return fn;
    }
    // Ignoring async client executables for now
    // const execConcurrencyValid =
    //     !exec.concurrency['_value.#i'] ||
    //     unigraph.getState('registry/runningExecutables').value.filter(_.propEq('slug', exec['unigraph.id'])).length <
    //         exec.concurrency['_value.#i'];

    if (
        Object.keys(environmentRunners).includes(exec.env['_value.%'])
        // && execConcurrencyValid
    ) {
        return wrapExecutable(
            // @ts-expect-error: already checked for environment runner inclusion
            environmentRunners[exec.env['_value.%']](exec.src['_value.%'], context, unigraph),
        );
    }
    console.error('not a good executable - ', exec);
    return undefined;
}
