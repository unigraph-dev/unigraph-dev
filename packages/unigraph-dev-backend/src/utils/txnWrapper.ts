import { UnigraphUpsert } from "@/custom"
import _, { has, uniqueId } from "lodash";

import { typeMap } from 'unigraph-dev-common/lib/types/consts'

function buildDgraphFunctionFromRefQuery(query: {key: string, value: string}[]) {
    let string = "";
    let string1 = "";
    const innerRefs: string[] = [];
    query.forEach(({key, value}: any) => {
        const refTarget = key.replace(/["%@\\]/g, "");
        const refQuery = value.replace(/["%@\\]/g, "");
        if (refTarget === "unigraph.id") {
            string += `AND eq(${refTarget}, "${refQuery}")`;
            string1 = `eq(${refTarget}, "${refQuery}")`;
        } else {
            // Referencing a field (not unigraph.id), do manual padding!
            // TODO: Support deep nested references
            innerRefs.push(`_value { ${refTarget} @filter(eq(<${typeMap[typeof refQuery]}>, "${refQuery}")) }`)
        }
    })
    if (innerRefs.length) {
        string1 = `type(Entity)`
        string = `AND type(Entity)`
    }
    let fn = `var(func: ${string1}) @filter(${string.slice(4)})`;
    if (innerRefs.length) {
        fn += " @cascade {\n";
        innerRefs.forEach(str => fn += str + "\n");
        fn += "}";
    }
    return fn;
}

/**
 * Wraps a given updater in upsert format by adding UIDs to body.
 * 
 * @param object 
 * @param string The first couple of characters passed in as uids
 */
export function wrapUpsertFromUpdater(orig: any, queryHead: string, hasUid: string | false = false): any {

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
        } else if (typeof origNow === 'object' && Array.isArray(origNow)) {
            // TODO: document expected behavior: when upserting an array, elements are always appended.
            if (typeof origNow[0] === 'object') {
                const currPos = buildQueryCount(thisUid, origNow.length, hasUid);
                const newOrig = origNow.map((el, index) => {
                    return {...el, _index: {"_value.#i": `val(${currPos}_${index})`}}
                });
                return newOrig; // Appends it
            } else {
                // Just a bunch of simple objects - we're not doing index management
                return origNow;
            }
        } else if (typeof origNow == 'object' && !Array.isArray(origNow)) {
            return Object.fromEntries([
                ...Object.entries(origNow).map(([key, value]) => {
                    if (key !== '_value[') {
                        return [key, recurse(origNow[key], buildQuery(thisUid, key, hasUid))]
                    } else {
                        return [key, recurse(origNow[key], thisUid)]
                    }
                }),
                ["uid",  hasUid ? hasUid : `uid(${thisUid})`] // Must have UID to do anything with it
            ]);
        }
    }

    const upsertObject = recurse(orig, queryHead, hasUid);

    return [upsertObject, queries];

}



/**
 * Converts a list of objects or schemas to a dgraph upsert operation.
 * This function will ensure that the field `unigraph.id` is unique and all references to be resolved.
 * @param inserts An array of objects or schemas to insert, containing the `$ref` field
 */
export function insertsToUpsert(inserts: any[]): UnigraphUpsert {

    const refUids: string[] = [];

    function insertsToUpsertRecursive(inserts: any[], appends: any[], queries: string[], currentObject: any) {
        // If this is a reference object
        if (currentObject) {
            if (currentObject.uid && currentObject.uid.startsWith('0x')) { 
                // uid takes precedence over $ref: when specifying explicit; otherwise doesnt care
                delete currentObject['$ref'];
                const refUid = "unigraphquery" + (queries.length + 1);
                const [upsertObject, upsertQueries] = wrapUpsertFromUpdater({"_value": currentObject['_value']}, refUid, currentObject.uid);
                queries.push(...upsertQueries);
                currentObject = Object.assign(currentObject, upsertObject);
            } else if (currentObject["$ref"] && currentObject["$ref"].query) {
                let refUid = "unigraphquery" + (queries.length + 1)
                if (currentObject.uid && currentObject.uid.startsWith('_:')) {
                    // definitely switch to same UID import
                    refUid = "unigraphref" + currentObject.uid.slice(2)
                } 
    
                const query = currentObject['$ref'].query;
                // FIXME: Some objects (e.g. with standoff properties or type aliases) doesn't use `_value`
                const [upsertObject, upsertQueries] = wrapUpsertFromUpdater({"_value": currentObject['_value']}, refUid);

                if (!refUids.includes(refUid)) {
                    refUids.push(refUid)
                    const dgraphFunction = buildDgraphFunctionFromRefQuery(query);
                    queries.push(refUid + " as " + dgraphFunction + "\n");
                    //currentObject["uid"] = refUid;
                    //currentObject = {"uid": `uid(${refUid})`}
                    queries.push(...upsertQueries)
                }
                
                currentObject = Object.assign(currentObject, {"uid": `uid(${refUid})`, ...upsertObject})
                delete currentObject['$ref'];
                const append: any = {uid: `uid(${refUid})`}
                query.forEach(({key, value}: any) => {if (key === "unigraph.id") append[key] = value});
                appends.push(append)
            }
        }
    
        const objectValues = Object.values(currentObject);
        for(let i=0; i<objectValues.length; ++i) {
            if (typeof objectValues[i] === "object" && !Array.isArray(objectValues[i])) {
                insertsToUpsertRecursive(inserts, appends, queries, objectValues[i]);
            } else if (typeof objectValues[i] === "object" && Array.isArray(objectValues[i])) {
                for(let j=0; j<(objectValues[i] as any[]).length; ++j) {
                    insertsToUpsertRecursive(inserts, appends, queries, (objectValues[i] as any[])[j]);
                }
            }
        }
        //console.log("-----------------------2", currentObject)
    }

    const insertsCopy = JSON.parse(JSON.stringify(inserts))
    const queries: any[] = []
    const appends: any[] = []
    for(let i=0; i<insertsCopy.length; ++i) {
        insertsToUpsertRecursive(insertsCopy, appends, queries, insertsCopy[i])
    }
    console.log("Upsert processed!")
    console.log(JSON.stringify({queries: queries, mutations: insertsCopy, appends: appends}, null, 4));
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