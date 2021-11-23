import { UnigraphUpsert } from "../types/unigraph"
import _, { has, uniqueId } from "lodash";

import { typeMap } from '../types/consts'
import { getRandomInt } from "../utils/utils";

function buildDgraphFunctionFromRefQuery(query: {key: string, value: string}[]) {
    let string = "";
    let string1 = "";
    let typeSelector = ""; let typeSelectorName = "";
    const innerRefs: string[] = [];
    query.forEach(({key, value}: any) => {
        const refTarget = key.replace(/["%@\\]/g, "");
        const refQuery = value.replace(/["]/g, "");
        if (refTarget === "unigraph.id") {
            string += `AND eq(${refTarget}, "${refQuery}")`;
            string1 = `eq(${refTarget}, "${refQuery}")`;
        } else if (refTarget === "type/unigraph.id") {
            //innerRefs.push(`type @filter(eq(<unigraph.id>, "${refQuery}"))`);
            typeSelectorName = "typeSelector" + getRandomInt().toString();
            typeSelector = `var(func: eq(<unigraph.id>, "${refQuery}")) { <~type> { `+ typeSelectorName +" as uid } }"
        } else {
            // Referencing a field (not unigraph.id), do manual padding!
            // TODO: Support deep nested references
            innerRefs.push(`_value { ${refTarget} @filter(eq(<${typeMap[typeof refQuery]}>, "${refQuery}")) }`)
        }
    })
    if (innerRefs.length) {
        if (typeSelectorName.length) {
            string1 = `uid(${typeSelectorName})`
            string = `AND type(Entity)`
        } else {
            string1 = `type(Entity)`
            string = `AND type(Entity)`
        }
    }
    let fn = `var(func: ${string1}) @filter(${string.slice(4)})`;
    if (innerRefs.length) {
        fn += " @cascade {\n";
        innerRefs.forEach(str => fn += str + "\n");
        fn += "}";
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
export function wrapUpsertFromUpdater(orig: any, queryHead: string, hasUid: string | false = false, blankUidsToRef: any): any {

    const queries: string[] = []

    function buildQuery(parUid: string, key: string, hasUid: string | false = false) {
        const currentQuery = `${parUid}_${queries.length.toString()}`
        const getUidQuery = hasUid ? hasUid : parUid
        const query = `var(func: uid(${getUidQuery})) { <${key}> { ${currentQuery} as uid }}`
        queries.push(query);
        return currentQuery;
    }

    function buildQueryCount(parUid: string, n: number, hasUid: string | false = false) {
        const currentQuery = `${parUid}_${queries.length.toString()}`
        const getUidQuery = hasUid ? hasUid : parUid
        const query = `var(func: uid(${getUidQuery})) { ${currentQuery}_scoped as count(<_value[>) }`
        const subqueries = [];
        for (let i=0; i<n; ++i) {subqueries.push(`${currentQuery}_${i} as math(${currentQuery}+${i})`)}
        const query2 = `var() {${currentQuery} as sum(val(${currentQuery}_scoped)) ${subqueries.join(' ')} }`
        queries.push(query, query2);
        return currentQuery; 
    }

    function recurse(origNow: any, thisUid: string, hasUid: string | false = false): any {
        //console.log("recursing --- " + JSON.stringify(origNow, null, 2) + thisUid)
        if (['undefined', 'null', 'number', 'bigint', 'string', 'boolean', 'symbol'].includes(typeof origNow)) {
            // This means the updater is creating new things inside or changing primitive values: we don't need uid
            queries.pop();
            return origNow;
        }
        if (hasUid && hasUid.startsWith('0x')) {
            queries.pop();
        }
        if (typeof origNow === 'object' && Array.isArray(origNow)) {
            // TODO: document expected behavior: when upserting an array, elements are always appended.
            if (typeof origNow[0] === 'object') {
                const currPos = buildQueryCount(thisUid, origNow.length, hasUid);
                const newOrig = origNow.map((el, index) => {
                    return {...el, _index: {"_value.#i": `val(${currPos}_${index})`}}
                });
                return newOrig; // Appends it
            } else if (origNow.length > 0) {
                // No UID available for list of primitives
                queries.pop();
                // Just a bunch of simple objects - we're not doing index management
                return origNow;
            } else return origNow;
        } else if (typeof origNow == 'object' && !Array.isArray(origNow)) {
            const res = Object.fromEntries([
                ...Object.entries(origNow).map(([key, value]) => {
                    if (key !== '_value[' && key !== '$ref' && key !== 'type') { // FIXME: This currently ignores subsequent UIDs if one is specified. Fix ASAP!
                        const ret = [key, recurse(origNow[key], buildQuery(thisUid, key, hasUid), origNow[key]?.uid?.startsWith?.('0x') ? origNow[key].uid : false)];
                        return ret;
                    } else if (key !== '$ref' && key !== 'type') {
                        return [key, recurse(origNow[key], thisUid)]
                    } else { // Don't process `$ref` because we need it later or `type` because it's overwritten
                        if (key === '$ref') {queries.pop()} // Have ref, will be overwritten, so no use keeping a duplicate variable
                        return [key, value]
                    }
                    // TODO: These matches are of lowest priority - so we should allow the upsert even if these objects are not used
                }),
                ["uid",  hasUid ? hasUid : `uid(${thisUid})`] // Must have UID to do anything with it
            ]);
            if (origNow.uid?.startsWith?.('_:')) blankUidsToRef[origNow.uid] = res.uid;
            return res;
        }
    }

    const upsertObject = recurse(orig, queryHead, hasUid);

    return [upsertObject, queries];

}

function* nextUid() {
    let index = 0;

    while (true) {
        yield `_:${index}`
        index++;
    }
}

/**
 * Converts a list of objects or schemas to a dgraph upsert operation.
 * This function will ensure that the field `unigraph.id` is unique and all references to be resolved.
 * @param inserts An array of objects or schemas to insert, containing the `$ref` field
 */
export function insertsToUpsert(inserts: any[], upsert = true): UnigraphUpsert {

    const refUids: string[] = [];
    const genUid = nextUid();
    const blankUids: any[] = [];
    const blankUidsToRef: Record<string, string> = {}

    function insertsToUpsertRecursive(inserts: any[], appends: any[], queries: string[], currentObject: any, currentOrigin: any[]) {
        let isBlankUid = false;
        // If this is a reference object
        if (currentObject) {
            if (currentObject.uid?.startsWith('_:')) isBlankUid = true;
            if (currentObject.uid && currentObject.uid.startsWith('0x')) { 
                // uid takes precedence over $ref: when specifying explicit; otherwise doesnt care
                delete currentObject['$ref'];
                if (upsert) {
                    const refUid = "unigraphquery" + (queries.length + 1);
                    const [upsertObject, upsertQueries] = wrapUpsertFromUpdater({"_value": currentObject['_value'], ...(currentObject['unigraph.indexes'] ? {"unigraph.indexes": currentObject['unigraph.indexes']} : {})}, refUid, currentObject.uid, blankUidsToRef);
                    queries.push(...upsertQueries);
                    currentObject = Object.assign(currentObject, upsertObject);
                }
            } else if (currentObject["$ref"] && currentObject["$ref"].query) {
                let refUid = "unigraphquery" + (queries.length + 1)
                if (currentObject.uid && currentObject.uid.startsWith('_:')) {
                    // definitely switch to same UID import
                    refUid = "unigraphref" + currentObject.uid.slice(2)
                } 
                currentOrigin?.map(el => {if (el?.uid === currentObject.uid) el.uid = `uid(${refUid})`;})
                const query = currentObject['$ref'].query;
                delete currentObject['$ref'];
                // FIXME: Some objects (e.g. with standoff properties or type aliases) doesn't use `_value`
                const [upsertObject, upsertQueries] = wrapUpsertFromUpdater({"_value": currentObject['_value']}, refUid, false, blankUidsToRef);

                if (!refUids.includes(refUid)) {
                    refUids.push(refUid)
                    let dgraphFunction = buildDgraphFunctionFromRefQuery(query);
                    if (Array.isArray(dgraphFunction)) {
                        queries.push(dgraphFunction[1]);
                        dgraphFunction = dgraphFunction[0];
                    }
                    queries.push(refUid + " as " + dgraphFunction + "\n");
                    //currentObject["uid"] = refUid;
                    //currentObject = {"uid": `uid(${refUid})`}
                    queries.push(...upsertQueries)
                }
                
                currentObject = Object.assign(currentObject, {"uid": `uid(${refUid})`, ...upsertObject})
                const append: any = {uid: `uid(${refUid})`}
                query.forEach(({key, value}: any) => {if (key === "unigraph.id") append[key] = value});
                appends.push(append)
            }
            if (isBlankUid) blankUids.push(currentObject)
        }
        //console.log('++++++++++++++++++++++++++++++++++')
        //console.log(JSON.stringify(currentObject, null, 4))

        if (currentObject['dgraph.type']?.includes('Entity')) {
            currentOrigin = currentOrigin ? JSON.parse(JSON.stringify(currentOrigin)) : undefined;
            if (!currentObject.uid) currentObject.uid = genUid.next().value;
            if (!currentObject['unigraph.origin']) currentObject['unigraph.origin'] = {uid: currentObject.uid};
            if (currentObject['unigraph.origin'] && !Array.isArray(currentObject['unigraph.origin'])) currentObject['unigraph.origin'] = [currentObject['unigraph.origin']];
            if (!currentOrigin) currentOrigin = [];
            currentOrigin.push(...currentObject['unigraph.origin']);
        }
    
        const objectValues = Object.values(currentObject);
        for(let i=0; i<objectValues.length; ++i) {
            if (typeof objectValues[i] === "object" && !Array.isArray(objectValues[i])) {
                insertsToUpsertRecursive(inserts, appends, queries, objectValues[i], currentOrigin);
            } else if (typeof objectValues[i] === "object" && Array.isArray(objectValues[i])) {
                for(let j=0; j<(objectValues[i] as any[]).length; ++j) {
                    if (!Object.keys(currentObject).includes('unigraph.origin')) insertsToUpsertRecursive(inserts, appends, queries, (objectValues[i] as any[])[j], currentOrigin);
                }
            }
        }

        blankUids.forEach(el => {
            if (el.uid?.startsWith('_:') && Object.keys(blankUidsToRef).includes(el.uid)) {
                el.uid = blankUidsToRef[el.uid]
            }
        })

        if (typeof currentObject === 'object' && !Array.isArray(currentObject) && currentOrigin) currentObject['unigraph.origin'] = currentOrigin;

        //console.log("-----------------------2", currentObject)
    }

    const insertsCopy = JSON.parse(JSON.stringify(inserts))
    const queries: any[] = []
    const appends: any[] = []
    for(let i=0; i<insertsCopy.length; ++i) {
        const curr = insertsCopy[i];
        if (!curr.uid) curr.uid = genUid.next().value;
        let origin = curr['unigraph.origin'];
        if (!origin && (!curr['dgraph.type'] || curr['dgraph.type'].includes['Entity'])) origin = {uid: curr.uid};
        if (origin && !Array.isArray(origin)) origin = [origin];
        insertsToUpsertRecursive(insertsCopy, appends, queries, curr, origin);
    }
    //console.log("Upsert processed!")
    //const util = require('util')
    //console.log(util.inspect({queries: queries, mutations: insertsCopy, appends: appends}, false, null, true /* enable colors */))
    return {queries: queries, mutations: insertsCopy, appends: appends}
}

// TODO: add the functionality to delete duplicate queries in upsert
export function anchorBatchUpsert(upsert: UnigraphUpsert): UnigraphUpsert {
    const queries = upsert.queries;
    const appends = upsert.appends;
    // 1. Use regex to make queries into a deduplicated array
    const re = /unigraphquery[0-9_]*/g;
    const extracted_queries = queries.map(query => {return {
        orig: query, 
        pattern: query.replace(re, "unigraphquery"),
        elements: query.match(re)
    }});
    // 2. Establish duplicacy
    const aliases: any = {};
    // somehow 

    const unique_extracted = _.uniqBy(extracted_queries, 'pattern');
    const appendsMap: any = {};
    appends.forEach(it => {appendsMap[it.uid] = it});
    const ids = _.flatten(unique_extracted.map(it => it.elements));
    const unique_appends = ids.map(el => appendsMap[`uid(${el})`]);
    return {
        queries: unique_extracted.map(it => it.orig),
        mutations: [],
        appends: unique_appends
    };
}