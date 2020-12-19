import { Definition, EntityDgraph, RefUnigraphIdType, Schema, SchemaDgraph, UidType, UnigraphIdType } from "@/json-ts";

function uid<IdType extends string>(id: IdType): UidType<IdType> {return {"uid": id}}
export function makeUnigraphId<IdType extends string>(id: IdType): UnigraphIdType<IdType> {return {"unigraph.id": id}}
export function makeRefUnigraphId<IdType extends string>(id: IdType): RefUnigraphIdType<IdType> {return {"$ref":{"key": "unigraph.id", "query": id}}}

// Duplicate type declaration - this should closely follow the one in json-ts.
type UnigraphTypeString = "$/primitive/number" | "$/primitive/boolean"
| "$/primitive/string" | "$/primitive/null" | "$/composer/Array" | "$/composer/Object" | "$/primitive/undefined"

function getUnigraphType (object: any): UnigraphTypeString {
    let typeString: UnigraphTypeString = "$/primitive/undefined"
    switch (typeof object) {
        case "number":
            typeString = "$/primitive/number";
            break;

        case "bigint":
            typeString = "$/primitive/number";
            break;

        case "boolean":
            typeString = "$/primitive/boolean";
            break;

        case "string":
            typeString = "$/primitive/string";
            break;
        
        case "object":
            if (Array.isArray(object)) typeString = "$/composer/Array";
            else typeString = "$/composer/Object";
            break;
    
        default:
            break;
    };
    return typeString;
}

type BuildEntityOptions = {makeAbstract: boolean, validateSchema: boolean}

/* Schema checking spec list:
 * - should be able to check basic objects (restrictive schema, nonabstract, unpadded)
 * - should be able to check nonrestrictive objects (i.e. fields don't exist on schema)
 * - should be able to check padded objects
 */

function buildUnigraphEntityPart (rawPart: any, options: BuildEntityOptions = {makeAbstract: false, validateSchema: true}, schemaMap: Record<string, Schema>, localSchema: Definition | any): {"_value": any} {
    let unigraphPartValue: any = undefined;
    let rawPartUnigraphType = getUnigraphType(rawPart);

    // Check for localSchema accordance
    if (localSchema.type && localSchema.type['unigraph.id'] === rawPartUnigraphType) {
        switch (rawPartUnigraphType) {
            case "$/composer/Array":
                let newLocalSchema = localSchema['parameters']['element'];
                unigraphPartValue = rawPart.map((el: any) => buildUnigraphEntityPart(el, options, schemaMap, newLocalSchema));
                break;
    
            case "$/composer/Object":
                // TODO: make it work for objects not indexed by strings too!
                let keysMap = localSchema['properties'].reduce((accu: any, now: any) => {
                    accu[now["key"]] = now["definition"];
                    return accu;
                }, {})
                if (!options.makeAbstract) {
                    unigraphPartValue = {};
                    Object.entries(rawPart).forEach(([key, value]: [string, any]) => {
                        let localSchema = keysMap[key];
                        if (!localSchema) throw new TypeError("Schema check failure for object: " + JSON.stringify(rawPart));
                        unigraphPartValue[key] = buildUnigraphEntityPart(value, options, schemaMap, localSchema);
                    })
                } else {
                    unigraphPartValue = Object.entries(rawPart).map(([key, value]: [string, any]) => {
                        // TODO: Add processing when making abstract
                        let localSchema = keysMap[key];
                        return {"key": key, "_value": value};
                    })
                };
                break;
        
            default:
                unigraphPartValue = rawPart;
                break;
        };
    } else if (localSchema.type && localSchema.type['unigraph.id'] && localSchema.type['unigraph.id'].startsWith('$/schema/') && rawPartUnigraphType === "$/composer/Object") {
        unigraphPartValue = buildUnigraphEntity(rawPart, localSchema.type['unigraph.id'], schemaMap, true, options);
    } else {
        throw new TypeError("Schema check failure for object: " + JSON.stringify(rawPart) + JSON.stringify(localSchema) + rawPartUnigraphType);
    }

    

    return {"_value": unigraphPartValue};
}

export function validatePaddedEntity(object: Object) {
    // TODO: Validate padded entity
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
export function buildUnigraphEntity (raw: Object, schemaName: string = "any", schemaMap: Record<string, Schema>, padding: boolean = true, options: BuildEntityOptions = {makeAbstract: false, validateSchema: true}): EntityDgraph<string> | TypeError {
    // Check for unvalidated entity
    if (padding === false && !validatePaddedEntity(raw)) {
        throw new TypeError("Entity validation failed for entity " + raw)
    } else {
        let localSchema = schemaMap[schemaName].definition
        return {
            "type": makeRefUnigraphId(schemaName) as RefUnigraphIdType<`$/schema/${string}`>,
            "dgraph.type": "Entity",
            ...(padding ? buildUnigraphEntityPart(raw, options, schemaMap, localSchema) : raw)
        };
    }
}