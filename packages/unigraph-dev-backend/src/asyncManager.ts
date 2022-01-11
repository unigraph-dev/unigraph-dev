/**
 * Main file for classes and functions of asyncManager, which deals with asynchronous locking and resource consistency.
 */

import AsyncLock from 'async-lock';

export const resources = ['caches/schema'];

export function getAsyncLock() {
    return new AsyncLock();
}

export function withLock(lock: AsyncLock, key: string | string[], it: () => Promise<any>): Promise<any> {
    return lock.acquire(key, (done) => {
        const fn = it();
        fn.then((res) => done(undefined, res)).catch((e) => done(e, undefined));
    });
}
