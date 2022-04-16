// Abstract definition for caches

import stringify from 'json-stable-stringify';
import { getCircularReplacer } from 'unigraph-dev-common/lib/utils/utils';
import DgraphClient from './dgraphClient';

export type Cache<T> = {
    data: T;
    dataAlt?: T[];
    updateNow(): any;
    cacheType: 'subscription' | 'manual';
    /* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
    subscribe(listener: Function): any
}

export function updateClientCache (states: any, key: string, newValue: any) {
    states.clientCaches[key] = newValue;
    Object.values(states.connections).forEach((conn: any) => {
        conn.send(stringify(
            {
                type: 'cache_updated',
                name: key,
                result: newValue,
            },
            { replacer: getCircularReplacer() },
        ),)
    })
}

export function initCaches (states: any, conn: any) {
    Object.entries(states.clientCaches).forEach(([key, value]: any) => {
        conn.send(stringify(
            {
                type: 'cache_updated',
                name: key,
                result: value,
            },
            { replacer: getCircularReplacer() },
        ));
    });
}
