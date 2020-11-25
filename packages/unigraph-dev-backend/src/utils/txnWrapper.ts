import { UnigraphUpsert } from "@/custom"

function insertsToUpsertRecursive(inserts: any[], appends: any[], queries: string[], currentObject: any) {
    // If this is a reference object
    if (currentObject && currentObject["$ref"] && Object.keys(currentObject["$ref"]).length === 1) {
        let refTarget = Object.keys(currentObject["$ref"])[0]
        let refQuery = currentObject["$ref"][refTarget]
        // FIXME: Check for safety
        queries.push("unigraphquery" + (queries.length + 1) + " as var(func: eq(" + refTarget + ", \"" + refQuery + "\"))");
        currentObject["uid"] = "uid(unigraphquery" + queries.length + ")";
        currentObject["$ref"] = undefined;
        let append: any = {uid: "uid(unigraphquery" + queries.length + ")"}
        append[refTarget] = refQuery
        appends.push(append)
    } else { // Check sub-fields
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