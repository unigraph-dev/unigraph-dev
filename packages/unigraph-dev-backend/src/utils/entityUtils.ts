import { EntityDgraph, RefUnigraphIdType, UidType, UnigraphIdType } from "@/json-ts";

function uid<IdType extends string>(id: IdType): UidType<IdType> {return {"uid": id}}
export function makeUnigraphId<IdType extends string>(id: IdType): UnigraphIdType<IdType> {return {"unigraph.id": id}}
export function makeRefUnigraphId<IdType extends string>(id: IdType): RefUnigraphIdType<IdType> {return {"$ref":{"unigraph.id": id}}}


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

export function validateEntityWithSchema(object: Object, schemaName: string) {
    if (schemaName === "any") {
        return true;
    } else {
        // TODO: Add schema validation
        return true;
    }
}

export function validateUnpaddedEntity(object: Object) {
    // TODO: Validate unpadded entity
    return true;
}

/**
 * Builds a Unigraph entity with a given object and its schema.
 * 
 * For more information on how the data model works, refer to the `/docs/schemas_and_objects.md` documentation.
 * 
 * @param raw The raw, unpadded object (or padded object if `padding` is false). However, `$ref` may be used.
 * @param schemaName The name of the schema object. If no schema is given, it would be given an `$/schema/any` schema.
 * @param validateSchema Whether to validate schema. Defaults to false. If validation is on and the schema does not match the object, an error would be returned instead.
 * @param padding Whether to pad the raw object, used to create/change objects with predicate-properties defined. If this is false and the object does not follow the data model, an error would be returned instead.
 */
export function buildUnigraphEntity (raw: Object, schemaName: string = "any", validateSchema: boolean = false, padding: boolean = true): EntityDgraph<string> | TypeError {
    // Check for unvalidated entity
    if (!validateEntityWithSchema(raw, schemaName) || (padding === false && !validateUnpaddedEntity(raw))) {
        return new TypeError("Entity validation failed for entity " + raw)
    } else {
        return {
            "type": makeRefUnigraphId(`$/schema/${schemaName}`) as RefUnigraphIdType<`$/schema/${string}`>,
            "dgraph.type": "Entity",
            ...(padding ? buildUnigraphEntityPart(raw) : raw)
        };
    }
}