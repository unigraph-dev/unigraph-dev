import { UnigraphUpsert } from "@/custom"

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
export function wrapUpsertFromUpdater(orig: any, queryHead: string): any {

    const queries: string[] = []

    function buildQuery(parUid: string, key: string) {
        const currentQuery = `${parUid}_${queries.length.toString()}`
        const query = `var(func: uid(${parUid})) { <${key}> { ${currentQuery} as uid }}`
        queries.push(query);
        return currentQuery;
    }

    function recurse(origNow: any, thisUid: string): any {
        //console.log("recursing --- " + JSON.stringify(origNow, null, 2) + thisUid)
        if (['undefined', 'null', 'number', 'bigint', 'string', 'boolean', 'symbol'].includes(typeof origNow)) {
            // This means the updater is creating new things inside or changing primitive values: we don't need uid
            queries.pop();
            return origNow;
        } else if (typeof origNow == 'object' && Array.isArray(origNow)) {
            throw new Error("Array upsertion is not implemented yet!")
        } else if (typeof origNow == 'object' && !Array.isArray(origNow)) {
            return Object.fromEntries([
                ["uid", `uid(${thisUid})`], // Must have UID to do anything with it
                ...Object.entries(origNow).map(([key, value]) => [key, recurse(origNow[key], buildQuery(thisUid, key))])
            ]);
        }
    }

    const upsertObject = recurse(orig, queryHead);

    return [upsertObject, queries];

}

function insertsToUpsertRecursive(inserts: any[], appends: any[], queries: string[], currentObject: any) {
    // If this is a reference object
    if (currentObject && currentObject["$ref"] && currentObject["$ref"].query) {
        if (currentObject.uid) { // uid takes precedence over $ref
            delete currentObject['$ref'];
        } else {
            const query = currentObject['$ref'].query;
            const dgraphFunction = buildDgraphFunctionFromRefQuery(query);
            queries.push("unigraphquery" + (queries.length + 1) + " as " + dgraphFunction + "\n");
            const refUid = "unigraphquery" + queries.length ;
            //currentObject["uid"] = refUid;
            delete currentObject['$ref'];
            const [upsertObject, upsertQueries] = wrapUpsertFromUpdater({"_value": currentObject['_value']}, refUid);
            //currentObject = {"uid": `uid(${refUid})`}
            currentObject = Object.assign(currentObject, {"uid": `uid(${refUid})`, ...upsertObject})
            queries.push(...upsertQueries)
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

/**
 * Converts a list of objects or schemas to a dgraph upsert operation.
 * This function will ensure that the field `unigraph.id` is unique and all references to be resolved.
 * @param inserts An array of objects or schemas to insert, containing the `$ref` field
 */
export function insertsToUpsert(inserts: any[]): UnigraphUpsert {
    const insertsCopy = JSON.parse(JSON.stringify(inserts))
    const queries: any[] = []
    const appends: any[] = []
    for(let i=0; i<insertsCopy.length; ++i) {
        insertsToUpsertRecursive(insertsCopy, appends, queries, insertsCopy[i])
    }
    return {queries: queries, mutations: [...insertsCopy, ...appends]}
}