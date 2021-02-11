import { UnigraphUpsert } from "@/custom"

function buildDgraphFunctionFromRefQuery(query: {key: string, value: string}[]) {
    let string = "";
    query.forEach(({key, value}: any) => {
        let refTarget = key.replace(/["%@\\]/g, "");
        let refQuery = value.replace(/["%@\\]/g, "");
        string += `AND eq(${refTarget}, "${refQuery}")`
    })
    return `var(func: has(dgraph.type)) @filter(${string.slice(4)})`
}

function insertsToUpsertRecursive(inserts: any[], appends: any[], queries: string[], currentObject: any) {
    // If this is a reference object
    if (currentObject && currentObject["$ref"] && currentObject["$ref"].query) {
        let query = currentObject['$ref'].query;
        let dgraphFunction = buildDgraphFunctionFromRefQuery(query);
        queries.push("unigraphquery" + (queries.length + 1) + " as " + dgraphFunction);
        currentObject["uid"] = "uid(unigraphquery" + queries.length + ")";
        currentObject["$ref"] = undefined;
        let append: any = {uid: "uid(unigraphquery" + queries.length + ")"}
        query.forEach(({key, value}: any) => append[key] = value);
        // TODO: Ability to upsert into existing objects too
        appends.push(append)
    } else { // Check sub-fields
        //console.log(currentObject)
        let objectValues = Object.values(currentObject);
        for(let i=0; i<objectValues.length; ++i) {
            if (typeof objectValues[i] === "object" && !Array.isArray(objectValues[i])) {
                insertsToUpsertRecursive(inserts, appends, queries, objectValues[i]);
            } else if (typeof objectValues[i] === "object" && Array.isArray(objectValues[i])) {
                for(let j=0; j<(objectValues[i] as any[]).length; ++j) {
                    insertsToUpsertRecursive(inserts, appends, queries, (objectValues[i] as any[])[j]);
                }
            }
        }
    }
}

/**
 * Converts a list of objects or schemas to a dgraph upsert operation.
 * This function will ensure that the field `unigraph.id` is unique and all references to be resolved.
 * @param inserts An array of objects or schemas to insert, containing the `$ref` field
 */
export function insertsToUpsert(inserts: any[]): UnigraphUpsert {
    let insertsCopy = JSON.parse(JSON.stringify(inserts))
    let queries: any[] = []
    let appends: any[] = []
    for(let i=0; i<insertsCopy.length; ++i) {
        insertsToUpsertRecursive(insertsCopy, appends, queries, insertsCopy[i])
    }
    return {queries: queries, mutations: [...insertsCopy, ...appends]}
}