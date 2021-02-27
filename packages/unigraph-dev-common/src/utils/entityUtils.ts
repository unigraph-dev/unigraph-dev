// FIXME: This file is too large! Either break it up or add synopsis here.

import { Definition, EntityDgraph, RefUnigraphIdType, Schema, UidType, UnigraphIdType, UnigraphTypeString } from "../types/json-ts";

//function uid<IdType extends string>(id: IdType): UidType<IdType> {return {"uid": id}}
export function makeUnigraphId<IdType extends string>(id: IdType): UnigraphIdType<IdType> {return {"unigraph.id": id}}
export function makeRefUnigraphId<IdType extends string>(id: IdType): RefUnigraphIdType<IdType> {return {"$ref": {"query": [{"key": "unigraph.id", "value": id}]}}}

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
    }
    return typeString;
}

type BuildEntityOptions = {makeAbstract: boolean, validateSchema: boolean}

/* Schema checking spec list:
 * - should be able to check basic objects (restrictive schema, nonabstract, unpadded)
 * - should be able to check nonrestrictive objects (i.e. fields don't exist on schema)
 * - should be able to check padded objects
 */

export function isTypeAlias(localSchema: Record<string, any>, rawPartUnigraphType: UnigraphTypeString): boolean {
    return (localSchema?.type['unigraph.id'] === rawPartUnigraphType) && (!rawPartUnigraphType.startsWith('$/composer/'));
}

function buildUnigraphEntityPart (rawPart: any, options: BuildEntityOptions = {makeAbstract: false, validateSchema: true}, schemaMap: Record<string, Schema>, localSchema: Definition | any): {"_value": any} {
    let unigraphPartValue: any = undefined;
    let predicate = "_value";
    const rawPartUnigraphType = getUnigraphType(rawPart);

    try {
        // Check for localSchema accordance
        if (localSchema.type && (localSchema.type['unigraph.id'] === rawPartUnigraphType || isTypeAlias(schemaMap[localSchema.type['unigraph.id']].definition, rawPartUnigraphType))) {
            switch (rawPartUnigraphType) {
                case "$/composer/Array":
                    predicate = "_value["
                    /* eslint-disable */ // Dependent recursive behavior
                    const newLocalSchema = localSchema['parameters']['element'];
                    unigraphPartValue = rawPart.map((el: any) => buildUnigraphEntityPart(el, options, schemaMap, newLocalSchema));
                    break;
        
                case "$/composer/Object":
                    // TODO: make it work for objects not indexed by strings too!
                    /* eslint-disable */ // Dependent recursive behavior
                    const keysMap = localSchema['properties'].reduce((accu: any, now: any) => {
                        accu[now["key"]] = now["definition"];
                        return accu;
                    }, {})
                    if (!options.makeAbstract) {
                        unigraphPartValue = {};
                        Object.entries(rawPart).forEach(([key, value]: [string, any]) => {
                            const localSchema = keysMap[key];
                            if (!localSchema) throw new TypeError("Schema check failure for object: " + JSON.stringify(rawPart));
                            unigraphPartValue[key] = buildUnigraphEntityPart(value, options, schemaMap, localSchema);
                        })
                    } else {
                        unigraphPartValue = Object.entries(rawPart).map(([key, value]: [string, any]) => {
                            // TODO: Add processing when making abstract
                            const localSchema = keysMap[key];
                            return {"key": key, "_value": value};
                        })
                    }
                    break;

                case "$/primitive/boolean":
                    predicate = "_value.!";
                    unigraphPartValue = rawPart;
                    break;

                case "$/primitive/number":
                    if (Number.isInteger(rawPart)) predicate = "_value.#i";
                    else predicate = "_value.#";
                    unigraphPartValue = rawPart;
                    break;

                case "$/primitive/string":
                    predicate = "_value.%";
                    unigraphPartValue = rawPart;
                    break;
            
                default:
                    break;
            }
        } else if (localSchema.type && localSchema.type['unigraph.id'] && localSchema.type['unigraph.id'].startsWith('$/schema/') && rawPartUnigraphType === "$/composer/Object") {
            unigraphPartValue = buildUnigraphEntity(rawPart, localSchema.type['unigraph.id'], schemaMap, true, options);
        } else {
            throw new TypeError("Schema check failure for object: " + JSON.stringify(rawPart) + JSON.stringify(localSchema) + rawPartUnigraphType);
        }
    } catch (e) {
        throw new Error('Building entity part error: ' + e + JSON.stringify(rawPart) + JSON.stringify(localSchema) + rawPartUnigraphType + '\n')
    }

    const res: any = {}; res[predicate] = unigraphPartValue;
    return res;
}

export function validatePaddedEntity(object: Record<string, any>) {
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
export function buildUnigraphEntity (raw: Record<string, any>, schemaName = "any", schemaMap: Record<string, Schema>, padding = true, options: BuildEntityOptions = {makeAbstract: false, validateSchema: true}): EntityDgraph<string> | TypeError {
    // Check for unvalidated entity
    if (padding === false && !validatePaddedEntity(raw)) {
        throw new TypeError("Entity validation failed for entity " + raw)
    } else {
        const localSchema = schemaMap[schemaName].definition
        const bodyObject: Record<string, any> = padding ? buildUnigraphEntityPart(raw, options, schemaMap, localSchema) : raw
        return {
            "type": makeUnigraphId(schemaName) as UnigraphIdType<`$/schema/${string}`>,
            "dgraph.type": "Entity",
            ...bodyObject
        };
    }
}

export function makeQueryFragmentFromType(schemaName: string, schemaMap: Record<string, any>) {
    function makePart(localSchema: Definition | any) {
        const entries = ["uid"];
        let type = localSchema.type["unigraph.id"];

        if (type.startsWith('$/schema/')) {
            if (schemaMap[type]?.definition?.type["unigraph.id"]?.startsWith('$/primitive/')) 
                type = schemaMap[type].definition.type["unigraph.id"]; // Is type alias
            else entries.push("_value {" + makePart(schemaMap[type].definition) + "}")
        };
        switch (type) {
            case "$/composer/Object":
                /* eslint-disable */ // Dependent recursive behavior
                const properties = localSchema.properties.map((p: any) => {
                    return p.key + makePart(p.definition)
                })
                entries.push("_value {" + properties.reduce((current: string, now: any) => current + "\n" + now, "") + "}");
                break;

            case "$/composer/Array":
                entries.push("<_value[> {" + makePart(localSchema.parameters.element) + "}");
                break;
            
            case "$/primitive/string":
                entries.push("<_value.%>");
                break;
                
            case "$/primitive/boolean":
                entries.push("<_value.!>");
                break;
                
            case "$/primitive/number":
                entries.push("<_value.#>", "<_value.#i>");
                break;

            default:
                break;
        }
        return "{" + entries.reduce((current: string, now: any) => current + "\n" + now, "") + "}";
    }
    const localSchema = schemaMap[schemaName].definition;
    return makePart(localSchema);

}

function unpadValue(something: any) {
    if (typeof something !== "object") return something
    const kvs = Object.entries(something)
    let ret = something
    kvs.forEach(([key, value]) => {if(key.startsWith('_value'))ret = value})
    return ret
}

/**
 * 
 * @param entity An already-processed entity for autoref
 * @param schemas List of schemas
 */
export function processAutoref(entity: any, schema = "any", schemas: Record<string, Schema>) {

    /**
     * Recursively looks for places to insert autoref.
     * 
     * This function relies on side-effects and will break if the entity is not mutable.
     * 
     * @param currentEntity 
     * @param schemas 
     */
    function recurse(currentEntity: any, schemas: Record<string, Schema>, localSchema: Definition | any) {
        const paddedEntity = currentEntity;
        currentEntity = unpadValue(currentEntity);
        if (paddedEntity?.type) recurse(paddedEntity.type, schemas, localSchema) // Check for type references as well
        switch (typeof currentEntity) {
            case "object":
                if (localSchema.type && localSchema.type['unigraph.id'] && localSchema.type['unigraph.id'].startsWith('$/schema/')) {
                    localSchema = schemas[localSchema.type['unigraph.id']].definition
                }

                if (Array.isArray(currentEntity)) {
                    currentEntity.forEach(e => recurse(unpadValue(e), schemas, localSchema['parameters']['element']));
                } else {
                    // Is object, check for various stuff

                    // 1. Can we do autoref based on reserved words?
                    const kv = Object.entries(currentEntity);
                    const keysMap = localSchema['properties'].reduce((accu: any, now: any) => {
                        accu[now["key"]] = now;
                        return accu;
                    }, {}) // TODO: Redundent code, abstract it somehow!
                    
                    kv.forEach(([key, value]) => {
                        if (key === "unigraph.id") {
                            // Add autoref by unigraph.id
                            currentEntity['$ref'] = {
                                query: [{key: 'unigraph.id', value: value}],
                            };
                            currentEntity['unigraph.id'] = undefined;
                        } else {
                            
                            const localSchema = keysMap[key];
                            if (localSchema['unique']) {
                                // This should be a unique criterion, add an autoref upsert
                                paddedEntity['$ref'] = {
                                    query: [{key: key, value: unpadValue(value)},
                                    ],
                                };
                                //currentEntity[key] = undefined; - shouldn't remove the reference. let dgraph match mutations.
                            }
                            recurse(unpadValue(value), schemas, localSchema["definition"]);
                        }
                    })
                }
                break;

            default:
                break;
        }
    }

    recurse(entity, schemas, schemas[schema].definition);
    return entity;
}

/**
 * Traverses a given updater object and returns the difference in the form of upsert object with uid.
 * 
 * @param object 
 */
export function getUpsertFromUpdater(orig: any, updater: any): any {

    function recurse(origNow: any, updaterNow: any): any {
        if (['undefined', 'null', 'number', 'bigint', 'string', 'boolean', 'symbol'].includes(typeof origNow)) {
            // This means the updater is creating new things inside or changing primitive values: we don't need uid
            return updaterNow;
        } else if (typeof origNow == 'object' && Array.isArray(origNow) && Array.isArray(updaterNow)) {
            return updaterNow.map((value, index) => index < origNow.length ? recurse(origNow[index], value) : recurse(undefined, value))
        } else if (typeof origNow == 'object' && !Array.isArray(origNow) && !Array.isArray(updaterNow)) {
            return Object.fromEntries([
                ["uid", updaterNow.uid && updaterNow.uid !== origNow.uid ? updaterNow.uid : origNow.uid],
                ...Object.entries(updaterNow).map(([key, value]) => [key, recurse(origNow[key], value)])
            ]);
        }
    }

    const upsertObject = recurse(orig, updater);

    return upsertObject;

}