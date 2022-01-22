import _, { has, uniqueId } from 'lodash';
import stringify from 'json-stable-stringify';
import { UnigraphUpsert } from '../types/unigraph';

import { typeMap } from '../types/consts';
import { getRandomInt } from './utils';

function buildDgraphFunctionFromRefQuery(query: { key: string; value: string }[]) {
    let string = '';
    let string1 = '';
    let typeSelector = '';
    let typeSelectorName = '';
    const innerRefs: string[] = [];
    query.forEach(({ key, value }: any) => {
        const refTarget = key.replace(/["%@\\]/g, '');
        const refQuery = value.replace(/["]/g, '');
        if (refTarget === 'unigraph.id') {
            string += `AND eq(${refTarget}, "${refQuery}")`;
            string1 = `eq(${refTarget}, "${refQuery}")`;
        } else if (refTarget === 'type/unigraph.id') {
            // innerRefs.push(`type @filter(eq(<unigraph.id>, "${refQuery}"))`);
            typeSelectorName = `typeSelector${getRandomInt().toString()}`;
            typeSelector = `var(func: eq(<unigraph.id>, "${refQuery}")) { <~type> { ${typeSelectorName} as uid } }`;
        } else {
            // Referencing a field (not unigraph.id), do manual padding!
            // TODO: Support deep nested references
            innerRefs.push(`_value { ${refTarget} @filter(eq(<${typeMap[typeof refQuery]}>, "${refQuery}")) }`);
        }
    });
    if (innerRefs.length) {
        if (typeSelectorName.length) {
            string1 = `uid(${typeSelectorName})`;
            string = 'AND type(Entity)';
        } else {
            string1 = 'type(Entity)';
            string = 'AND type(Entity)';
        }
    }
    let fn = `var(func: ${string1}) @filter(${string.slice(4)})`;
    if (innerRefs.length) {
        fn += ' @cascade {\n';
        innerRefs.forEach((str) => {
            fn += `${str}\n`;
        });
        fn += '}';
    }
    if (typeSelector) fn = [fn, typeSelector] as any;
    return fn;
}

/**
 * Wraps a given updater in upsert format by adding UIDs to body.
 *
 * @param object
 * @param string The first couple of characters passed in as uids
 */
export function wrapUpsertFromUpdater(
    orig: any,
    queryHead: string,
    blankUidsToRef: any,
    hasUid: string | false = false,
): any {
    const queries: string[] = [];
    const appends: any[] = [];

    function buildQuery(parUid: string, key: string, hasUidHere: string | false = false) {
        const currentQuery = `${parUid}_${queries.length.toString()}`;
        const getUidQuery = hasUidHere || parUid;
        const query = `var(func: uid(${getUidQuery})) { <${key}> { ${currentQuery} as uid }}`;
        queries.push(query);
        return currentQuery;
    }

    function buildQueryCount(parUid: string, n: number, hasUidHere: string | false = false) {
        const currentQuery = `${parUid}_${queries.length.toString()}`;
        const getUidQuery = hasUidHere || parUid;
        const query = `var(func: uid(${getUidQuery})) { ${currentQuery}_scoped as count(<_value[>) }`;
        const subqueries = [];
        for (let i = 0; i < n; i += 1) {
            subqueries.push(`${currentQuery}_${i} as math(${currentQuery}+${i})`);
        }
        const query2 = `var() {${currentQuery} as sum(val(${currentQuery}_scoped)) ${subqueries.join(' ')} }`;
        queries.push(query, query2);
        return currentQuery;
    }

    function recurse(origNow: any, thisUid: string, hasUidHere: string | false = false): any {
        // console.log("recursing --- " + JSON.stringify(origNow, null, 2) + thisUid)
        if (['undefined', 'null', 'number', 'bigint', 'string', 'boolean', 'symbol'].includes(typeof origNow)) {
            // This means the updater is creating new things inside or changing primitive values: we don't need uid
            queries.pop();
            return origNow;
        }
        if (hasUidHere && hasUidHere.startsWith('0x')) {
            queries.pop();
        }
        if (typeof origNow === 'object' && Array.isArray(origNow)) {
            // TODO: document expected behavior: when upserting an array, elements are always appended.
            if (typeof origNow[0] === 'object') {
                const currPos = buildQueryCount(thisUid, origNow.length, hasUidHere);
                const newOrig = origNow.map((el, index) => {
                    if (el?._key) {
                        queries.push(
                            `var(func: uid(${hasUidHere || thisUid})) {
                                <_value[> @filter(eq(<_key>, "${el?._key}")) {
                                    ${currPos}_key_${index} as uid
                                } 
                            }`,
                        );
                        appends.push({
                            uid: `uid(${currPos}_key_${index})`,
                            _value: { uid: `_:${getRandomInt()}${getRandomInt()}` },
                        });
                    }
                    return {
                        ...el,
                        _index: { '_value.#i': `val(${currPos}_${index})` },
                    };
                });
                return newOrig; // Appends it
            }
            if (origNow.length > 0) {
                // No UID available for list of primitives
                queries.pop();
                // Just a bunch of simple objects - we're not doing index management
                return origNow;
            }
            return origNow;
        }
        if (typeof origNow == 'object' && !Array.isArray(origNow)) {
            const res = Object.fromEntries([
                ...Object.entries(origNow).map(([key, value]) => {
                    if (key !== '_value[' && key !== '$ref' && key !== 'type') {
                        // FIXME: This currently ignores subsequent UIDs if one is specified. Fix ASAP!
                        const ret = [
                            key,
                            recurse(
                                origNow[key],
                                buildQuery(thisUid, key, hasUidHere),
                                origNow[key]?.uid?.startsWith?.('0x') ? origNow[key].uid : false,
                            ),
                        ];
                        return ret;
                    }
                    if (key !== '$ref' && key !== 'type') {
                        return [key, recurse(origNow[key], thisUid)];
                    } // Don't process `$ref` because we need it later or `type` because it's overwritten
                    if (key === '$ref') {
                        queries.pop();
                    } // Have ref, will be overwritten, so no use keeping a duplicate variable
                    return [key, value];

                    // TODO: These matches are of lowest priority - so we should allow the upsert even if these objects are not used
                }),
                ['uid', hasUidHere || `uid(${thisUid})`], // Must have UID to do anything with it
            ]);
            // eslint-disable-next-line no-param-reassign
            if (origNow.uid?.startsWith?.('_:')) blankUidsToRef[origNow.uid] = res.uid;
            if (origNow.uid?.startsWith?.('_:link')) {
                appends.push({
                    uid: res.uid,
                    'unigraph.origin': [{ uid: res.uid }],
                });
                res.uid = origNow.uid;
            }
            return res;
        }
        return origNow;
    }

    const upsertObject = recurse(orig, queryHead, hasUid);

    return [upsertObject, queries, appends];
}

function* nextUid() {
    let index = 0;

    while (true) {
        yield `_:${index}`;
        index += 1;
    }
}

/**
 * Converts a list of objects or schemas to a dgraph upsert operation.
 * This function will ensure that the field `unigraph.id` is unique and all references to be resolved.
 * @param inserts An array of objects or schemas to insert, containing the `$ref` field
 */
export function insertsToUpsert(
    inserts: any[],
    upsert = true,
    schemasMap: Record<string, any> | undefined = undefined,
): UnigraphUpsert {
    const refUids: string[] = [];
    const refQueries: Record<string, string> = {};
    const genUid = nextUid();
    const blankUids: any[] = [];
    const blankUidsToRef: Record<string, string> = {};

    function insertsToUpsertRecursive(appends: any[], queries: string[], currentObject: any, currentOrigin: any[]) {
        let isBlankUid = false;
        // If this is a reference object
        if (currentObject) {
            if (currentObject.uid?.startsWith('_:')) isBlankUid = true;
            if (currentObject?.$ref?.query?.length === 1 && currentObject?.$ref?.query[0]?.key === 'unigraph.id') {
                // If we can find something in the schema map, just use that
                const nsRefValue = currentObject?.$ref?.query[0]?.value;
                if (schemasMap?.[nsRefValue]?.uid) {
                    currentObject.uid = schemasMap[nsRefValue].uid;
                }
            }
            if (currentObject.uid && currentObject.uid.startsWith('0x')) {
                // uid takes precedence over $ref: when specifying explicit; otherwise doesnt care
                delete currentObject.$ref;
                if (upsert) {
                    const refUid = `unigraphquery${queries.length + 1}`;
                    const [upsertObject, upsertQueries, upsertAppends] = wrapUpsertFromUpdater(
                        {
                            _value: currentObject._value,
                            ...(currentObject['unigraph.indexes']
                                ? {
                                      'unigraph.indexes': currentObject['unigraph.indexes'],
                                  }
                                : {}),
                        },
                        refUid,
                        blankUidsToRef,
                        currentObject.uid,
                    );
                    queries.push(...upsertQueries);
                    appends.push(...upsertAppends);
                    currentObject = Object.assign(currentObject, upsertObject);
                }
            } else if (currentObject.$ref && currentObject.$ref.query) {
                let refUid = `unigraphquery${queries.length + 1}`;
                if (currentObject.uid && currentObject.uid.startsWith('_:')) {
                    // definitely switch to same UID import
                    refUid = `unigraphref${currentObject.uid.slice(2)}`;
                }
                // check for existing refUids - and detect if found in existing query
                if (Object.keys(refQueries).includes(stringify(currentObject.$ref))) {
                    refUid = refQueries[stringify(currentObject.$ref)];
                } else {
                    refQueries[stringify(currentObject.$ref)] = refUid;
                }

                currentOrigin?.map((el) => {
                    if (el?.uid === currentObject.uid) el.uid = `uid(${refUid})`;
                });
                const { query } = currentObject.$ref;
                delete currentObject.$ref;
                // FIXME: Some objects (e.g. with standoff properties or type aliases) doesn't use `_value`
                const [upsertObject, upsertQueries, upsertAppends] = wrapUpsertFromUpdater(
                    {
                        _value: currentObject._value,
                        ...(currentObject['unigraph.indexes']
                            ? {
                                  'unigraph.indexes': currentObject['unigraph.indexes'],
                              }
                            : {}),
                    },
                    refUid,
                    blankUidsToRef,
                    false,
                );
                appends.push(...upsertAppends);
                if (!refUids.includes(refUid)) {
                    refUids.push(refUid);
                    const dgraphFunction = buildDgraphFunctionFromRefQuery(query);
                    let ret = dgraphFunction;
                    if (Array.isArray(dgraphFunction)) {
                        queries.push(dgraphFunction[1]);
                        [ret] = dgraphFunction;
                    }
                    queries.push(`${refUid} as ${ret}\n`);
                    // currentObject["uid"] = refUid;
                    // currentObject = {"uid": `uid(${refUid})`}
                    queries.push(...upsertQueries);
                }

                currentObject = Object.assign(currentObject, {
                    uid: `uid(${refUid})`,
                    ...upsertObject,
                });
                const append: any = { uid: `uid(${refUid})` };
                query.forEach(({ key, value }: any) => {
                    if (key === 'unigraph.id') append[key] = value;
                });
                appends.push(append);
            }
            if (isBlankUid) blankUids.push(currentObject);
        }
        // console.log('++++++++++++++++++++++++++++++++++')
        // console.log(JSON.stringify(currentObject, null, 4))

        if (currentObject['dgraph.type']?.includes('Entity')) {
            currentOrigin = currentOrigin ? JSON.parse(JSON.stringify(currentOrigin)) : undefined;
            if (!currentObject.uid) currentObject.uid = genUid.next().value;
            if (!currentObject['unigraph.origin']) currentObject['unigraph.origin'] = { uid: currentObject.uid };
            if (currentObject['unigraph.origin'] && !Array.isArray(currentObject['unigraph.origin'])) {
                currentObject['unigraph.origin'] = [currentObject['unigraph.origin']];
            }
            if (!currentOrigin) currentOrigin = [];
            currentOrigin.push(...currentObject['unigraph.origin']);
        }

        const objectValues = Object.values(currentObject);
        for (let i = 0; i < objectValues.length; i += 1) {
            if (typeof objectValues[i] === 'object' && !Array.isArray(objectValues[i])) {
                insertsToUpsertRecursive(appends, queries, objectValues[i], currentOrigin);
            } else if (typeof objectValues[i] === 'object' && Array.isArray(objectValues[i])) {
                for (let j = 0; j < (objectValues[i] as any[]).length; j += 1) {
                    if (!Object.keys(currentObject).includes('unigraph.origin')) {
                        insertsToUpsertRecursive(appends, queries, (objectValues[i] as any[])[j], currentOrigin);
                    }
                }
            }
        }

        blankUids.forEach((el) => {
            if (el.uid?.startsWith('_:') && Object.keys(blankUidsToRef).includes(el.uid)) {
                el.uid = blankUidsToRef[el.uid];
            }
        });

        if (typeof currentObject === 'object' && !Array.isArray(currentObject) && currentOrigin) {
            currentObject['unigraph.origin'] = currentOrigin;
        }

        // console.log("-----------------------2", currentObject)
    }

    const insertsCopy = JSON.parse(JSON.stringify(inserts));
    const queries: any[] = [];
    const appends: any[] = [];
    for (let i = 0; i < insertsCopy.length; i += 1) {
        const curr = insertsCopy[i];
        if (!curr.uid) curr.uid = genUid.next().value;
        let origin = curr['unigraph.origin'];
        if (!origin && (!curr['dgraph.type'] || curr['dgraph.type'].includes.Entity)) origin = { uid: curr.uid };
        if (origin && !Array.isArray(origin)) origin = [origin];
        insertsToUpsertRecursive(appends, queries, curr, origin);
    }
    // console.log("Upsert processed!")
    // const util = require('util')
    // console.log(util.inspect({queries: queries, mutations: insertsCopy, appends: appends}, false, null, true /* enable colors */))
    return { queries, mutations: insertsCopy, appends };
}
