import { EntityDgraph } from "@/json-ts";

function buildUnigraphEntityPart (rawPart: any, makeAbstract: boolean = false): {"_value": any} {
    let unigraphPartValue: any = undefined;
    if (typeof rawPart === "object" && Array.isArray(rawPart)) {
        unigraphPartValue = rawPart.map((el: any) => buildUnigraphEntityPart(el));
    } else if (typeof rawPart === "object") {
        if (!makeAbstract) {
            unigraphPartValue = {};
            Object.entries(rawPart).forEach(([key, value]: [string, any]) => {
                unigraphPartValue[key] = buildUnigraphEntityPart(value);
            })
        } else {
            unigraphPartValue = Object.entries(rawPart).map(([key, value]: [string, any]) => {
                return {"key": key, "_value": value};
            })
        }
    } else { unigraphPartValue = rawPart; }
    return {"_value": unigraphPartValue};
}

export function buildUnigraphEntity (raw: Object): EntityDgraph<string> {
    return {
        "dgraph.type": "Entity",
        "_value": buildUnigraphEntityPart(raw)
    };
}