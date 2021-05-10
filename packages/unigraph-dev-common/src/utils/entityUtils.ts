// FIXME: This file is too large! Either break it up or add synopsis here.

import { jsonToGraphQLQuery } from "json-to-graphql-query";
import _ from "lodash";
import { ComposerUnionInstance, Definition, EntityDgraph, Field, RefUnigraphIdType, Schema, UnigraphIdType, UnigraphTypeString } from "../types/json-ts";

//function uid<IdType extends string>(id: IdType): UidType<IdType> {return {"uid": id}}
export function makeUnigraphId<IdType extends string>(id: IdType): UnigraphIdType<IdType> {return {"unigraph.id": id}}
export function makeRefUnigraphId<IdType extends string>(id: IdType): RefUnigraphIdType<IdType> {return {"$ref": {"query": [{"key": "unigraph.id", "value": id}]}}}

function isDate(dateStr: string) {
    return !isNaN(new Date(dateStr).getDate());
  }

function getUnigraphType (object: any, schemaType: UnigraphTypeString): UnigraphTypeString {
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
            if (schemaType === "$/primitive/datetime" && isDate(object)) typeString = "$/primitive/datetime";
            else typeString = "$/primitive/string";
            break;
        
        case "object":
            if (Array.isArray(object) && schemaType === "$/composer/List") typeString = "$/composer/List";
            else if (Array.isArray(object)) typeString = "$/composer/Array";
            else typeString = "$/composer/Object";
            break;
    
        default:
            break;
    }
    return typeString;
}

type BuildEntityOptions = {validateSchema: boolean, isUpdate: boolean}
type PropertyDescription = Partial<Field<any>>

/* Schema checking spec list:
 * - should be able to check basic objects (restrictive schema, nonabstract, unpadded)
 * - should be able to check nonrestrictive objects (i.e. fields don't exist on schema)
 * - should be able to check padded objects
 */

export function isTypeAlias(localSchema: Record<string, any>, rawPartUnigraphType: UnigraphTypeString): boolean {
    return (localSchema?.type['unigraph.id'] === rawPartUnigraphType) && (!rawPartUnigraphType.startsWith('$/composer/'));
}

/**
 * Process an induction step of building unigraph entity.
 * 
 * It checks the type of current rawPart, and generate padded entity based on schema rules.
 * 
 * Currently, if an object contains a field that isn't in the schema, it would throw an error of failure.
 * However, you can have schema fields that are not covered by the object, and it would be OK.
 * 
 * @param rawPart Raw part of the schema, corresponding to the local definition of localSchema.
 * @param options A list of options when building entity.
 * @param schemaMap A map of all schemas indexed by schema unigraph.id starting with $/package/.../schema or $/schema
 * @param localSchema A definition, usually the value corresponding to the "definition" key in schemas.
 */
function buildUnigraphEntityPart (rawPart: any, options: BuildEntityOptions, schemaMap: Record<string, Schema>, localSchema: Definition | any, propDesc: PropertyDescription | Record<string, never> = {}): {"_value": any} {
    let unigraphPartValue: any = undefined;
    let predicate = "_value";
    let noPredicate = false;
    const rawPartUnigraphType = getUnigraphType(rawPart, localSchema.type?.['unigraph.id']);

    if (localSchema.type?.['unigraph.id'] === "$/schema/any" && typeof rawPart?.type?.['unigraph.id'] === "string") {
        // If schema is any object and the object has a type (that we can check), 
        // we allow any rawPart by setting localSchema type to that of object.
        localSchema = JSON.parse(JSON.stringify(localSchema));
        localSchema.type['unigraph.id'] = rawPart.type['unigraph.id'];
    } else if (localSchema.type?.['unigraph.id'] === "$/schema/any") {
        throw new TypeError('`$/schema/any` directive must have a corresponding type declaration in object!')
    }

    // TODO: Allow for selecting union types too

    delete rawPart.type;

    try {
        // Check for localSchema accordance
        if (localSchema.type?.['unigraph.id'] === rawPartUnigraphType) {
            // Case 1: Entity type == schema type. This is straightforward
            switch (rawPartUnigraphType) {
                case "$/composer/Array":
                    predicate = "_value["
                    /* eslint-disable */ // Dependent recursive behavior
                    const newLocalSchema1 = localSchema['_parameters']['_element'];
                    unigraphPartValue = rawPart.map((el: any, index: number) => {return {
                        ...buildUnigraphEntityPart(el, options, schemaMap, newLocalSchema1), 
                        _index: {"_value.#i": index}
                    }});
                    break;

                case "$/composer/List":
                    predicate = "_value["
                    /* eslint-disable */ // Dependent recursive behavior
                    const newLocalSchema2 = localSchema['_parameters']['_element'];
                    unigraphPartValue = rawPart.map((el: any) => buildUnigraphEntityPart(el, options, schemaMap, newLocalSchema2));
                    break;
        
                case "$/composer/Object":
                    // TODO: make it work for objects not indexed by strings too!
                    /* eslint-disable */ // Dependent recursive behavior
                    const keysMap = localSchema['_properties'].reduce((accu: any, now: any) => {
                        accu[now["_key"]] = now;
                        return accu;
                    }, {})
                    unigraphPartValue = {};
                    Object.entries(rawPart).forEach(([key, value]: [string, any]) => {
                        const localSchema = keysMap[key]['_definition'];
                        const propDesc: PropertyDescription = _.pickBy({_propertyType: keysMap[key]._propertyType}, _.identity)
                        if (!localSchema) throw new TypeError("Schema check failure for object: " + JSON.stringify(rawPart));
                        unigraphPartValue[key] = buildUnigraphEntityPart(value, options, schemaMap, localSchema, propDesc);
                    })
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

                case "$/primitive/datetime":
                    predicate = "_value.%dt";
                    unigraphPartValue = rawPart;
                    break;
            
                default:
                    break;
            }
        } else if (localSchema.type?.['unigraph.id']?.startsWith('$/schema/') && rawPartUnigraphType === "$/composer/Object" && 
            Object.keys(rawPart).length === 1 && typeof rawPart.uid === "string" && rawPart.uid.startsWith("0x")) {
            // Case 2: References another schema using UID, passing through.
            unigraphPartValue = rawPart
        } else if (localSchema.type?.['unigraph.id']?.startsWith('$/schema/') && rawPartUnigraphType === "$/composer/Object" ) {
            // Case 2: References another schema.
            unigraphPartValue = buildUnigraphEntity(rawPart, localSchema.type['unigraph.id'], schemaMap, true, options, propDesc);
        } else if (localSchema.type?.['unigraph.id']?.startsWith('$/schema/') && rawPartUnigraphType !== "$/composer/Object" && rawPartUnigraphType) {
            // Case 2.1: References another schema with primitive type (thus no predicate)
            noPredicate = true;
            unigraphPartValue = buildUnigraphEntity(rawPart, localSchema.type['unigraph.id'], schemaMap, true, options, propDesc);
        } else if (localSchema.type && isTypeAlias(schemaMap[localSchema.type['unigraph.id']]?._definition, rawPartUnigraphType)) {
            // Case 2.5: Is type alias (return unigraph object but keeps relationship)
            noPredicate = true;
            unigraphPartValue = buildUnigraphEntity(rawPart, localSchema.type['unigraph.id'], schemaMap, true, options, propDesc);
        } else if (localSchema.type?.['unigraph.id']?.startsWith('$/composer/Union')) {
            // Case 3: Local schema is a union: we should compare against all possible choices recursively
            noPredicate = true;
            let unionSchema = localSchema as ComposerUnionInstance;
            let choicesResults = unionSchema._parameters._definitions.map(defn => {
                try {
                    return [defn, buildUnigraphEntityPart(rawPart, options, schemaMap, defn)]
                } catch (e) {console.log(e); return undefined};
            }).filter(x => x !== undefined);
            if (choicesResults.length !== 1 && rawPartUnigraphType !== "$/primitive/undefined") {
                throw new TypeError("Union type does not allow ambiguous or nonexistent selections!" + JSON.stringify(rawPart) + JSON.stringify(localSchema) + rawPartUnigraphType)
            } else {
                unigraphPartValue = choicesResults[0]?.[1];
            }
        } else{
            // Default: Error out.
            throw new TypeError("Schema check failure for object: " + JSON.stringify(rawPart) + JSON.stringify(localSchema) + rawPartUnigraphType);
        }
    } catch (e) {
        throw new Error('Building entity part error: ' + e + JSON.stringify(rawPart) + JSON.stringify(localSchema) + rawPartUnigraphType + '\n')
    }

    let res: any = {...propDesc};
    if (!noPredicate) res[predicate] = unigraphPartValue;
    else res = unigraphPartValue;
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
export function buildUnigraphEntity (raw: Record<string, any>, schemaName = "any", schemaMap: Record<string, Schema>, padding = true, options: BuildEntityOptions = {validateSchema: true, isUpdate: false}, propDesc: any = {}): EntityDgraph<string> | TypeError {
    // Check for unvalidated entity
    if (padding === false && !validatePaddedEntity(raw)) {
        throw new TypeError("Entity validation failed for entity " + raw)
    } else {
        const localSchema = schemaMap[schemaName]._definition
        const unigraphId = raw?.['unigraph.id'];
        if (unigraphId) delete raw?.['unigraph.id'];
        const bodyObject: Record<string, any> = padding ? buildUnigraphEntityPart(raw, options, schemaMap, localSchema, {}) : raw
        const now = new Date().toISOString();
        let timestamp: any = {_updatedAt: now}
        if (!options.isUpdate) timestamp._createdAt = now;
        const result = {
            "type": makeUnigraphId(schemaName) as UnigraphIdType<`$/schema/${string}`>,
            "dgraph.type": "Entity",
            ...bodyObject,
            "_timestamp": timestamp,
            ...propDesc
        };
        // @ts-ignore
        if (unigraphId) result['unigraph.id'] = unigraphId;
        if (schemaMap[schemaName]._hide) result['_hide'] = true;
        //console.log(JSON.stringify(result, null, 4));
        // @ts-ignore
        return result;
    }
}

export function makeQueryFragmentFromType(schemaName: string, schemaMap: Record<string, any>, maxDepth = 10) {

    const timestampQuery = {
        _timestamp: {
            _updatedAt: {},
            _createdAt: {}
        }
    };

    function makePart(localSchema: Definition | any, depth = 0, isRoot = false) {
        if (depth > maxDepth) return {};
        let entries: any = {"uid": {}, 'type': { "<unigraph.id>": {} }};
        let type = localSchema.type["unigraph.id"];

        if (type.startsWith('$/schema/')) {
            if (schemaMap[type]?._definition?.type["unigraph.id"]?.startsWith('$/primitive/')) 
                type = schemaMap[type]._definition.type["unigraph.id"]; // Is type alias
            else entries = _.merge(entries, {"_value": makePart(schemaMap[type]._definition, depth+1, true)}, makePart(schemaMap[type]._definition, depth+1, true)) // Possibly non-object data
        };
        switch (type) {
            case "$/composer/Object":
                /* eslint-disable */ // Dependent recursive behavior
                const properties = localSchema._properties.map((p: any) => {
                    let ret: any = {}; ret[p._key] = makePart(p._definition, depth+1);
                    return ret
                })
                entries = _.merge(entries, {"_value": _.merge({}, ...properties)});
                break;

            case "$/composer/Union":
                let defn = localSchema as ComposerUnionInstance;
                const options = defn._parameters._definitions.map(defnel => {
                    let children: any = makePart(defnel, depth+1)
                    entries = _.merge(entries, children);
                    //console.log(children)
                });
                break;

            case "$/composer/Array":
                entries = _.merge(entries, {"<_value[>": {
                    ...makePart(localSchema._parameters._element, depth+1)}, 
                    "<_index>": { "<_value.#i>": {}, "<_value.#>": {} }
                });
                break;
            
            case "$/primitive/string":
                entries["<_value.%>"] = {};
                break;

            case "$/primitive/datetime":
                entries["<_value.%dt>"] = {};
                break;
                
            case "$/primitive/boolean":
                entries["<_value.!>"] = {};
                break;
                
            case "$/primitive/number":
                entries["<_value.#>"] = {};
                entries["<_value.#i>"] = {};
                break;

            default:
                break;
        }
        if (isRoot) _.merge(entries, timestampQuery)
        return entries;
    }
    const localSchema = schemaMap[schemaName]._definition;
    let res = makePart(localSchema, 0, true)
    let ret = jsonToGraphQLQuery(res)
    //console.log(ret)
    return "{" + ret + "}";

}

function unpadValue(something: any) {
    if (typeof something !== "object") return something
    const kvs = Object.entries(something)
    let ret = something
    kvs.forEach(([key, value]) => {if(key.startsWith('_value')) ret = value})
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
     * @param currentEntity 
     * @param schemas 
     */
    function recurse(currentEntity: any, schemas: Record<string, Schema>, localSchema: Definition | any) {
        console.log("=====================")
        if (currentEntity.type?.['unigraph.id']?.includes('$/schema/')) {
            localSchema = schemas[currentEntity.type['unigraph.id']]._definition
        }
        console.log(JSON.stringify(currentEntity), JSON.stringify(localSchema))
        const paddedEntity = currentEntity;
        currentEntity = unpadValue(currentEntity);
        if (paddedEntity?.type) recurse(paddedEntity.type, schemas, localSchema) // Check for type references as well 
        console.log(localSchema, JSON.stringify(currentEntity))
        switch (typeof currentEntity) {
            case "object":
                if (localSchema.type?.['unigraph.id']?.startsWith('$/schema/')) {
                    localSchema = schemas[localSchema.type['unigraph.id']]._definition
                }
                //console.log(localSchema, currentEntity)
                if (Array.isArray(currentEntity)) {
                    currentEntity.forEach(e => recurse(unpadValue(e), schemas, localSchema['_parameters']['_element']));
                } else {
                    // Is object, check for various stuff

                    // 1. Can we do autoref based on reserved words?
                    const kv = Object.entries(currentEntity);
                    const keysMap = localSchema['_properties']?.reduce((accu: any, now: any) => {
                        accu[now["_key"]] = now;
                        return accu;
                    }, {}) // TODO: Redundent code, abstract it somehow!
                    
                    kv.forEach(([key, value]) => {
                        if (key === "unigraph.id") {
                            // Add autoref by unigraph.id
                            currentEntity['$ref'] = {
                                query: [{key: 'unigraph.id', value: value}],
                            };
                            delete currentEntity['unigraph.id'];
                        } else if (Object.keys(keysMap).includes(key)) {
                            
                            const localSchema = keysMap[key];
                            if (localSchema['_unique']) {
                                // This should be a unique criterion, add an autoref upsert
                                paddedEntity['$ref'] = {
                                    query: [{key: key, value: unpadValue(value)},
                                    ],
                                };
                                //currentEntity[key] = undefined; - shouldn't remove the reference. let dgraph match mutations.
                            }
                            recurse(unpadValue(value), schemas, localSchema["_definition"]);
                        }
                    })
                }
                break;

            default:
                break;
        }
        //console.log("=====================outro")
    }
    entity = JSON.parse(JSON.stringify(entity))
    recurse(entity, schemas, schemas[schema]._definition);
    return entity;
}

/**
 * Processes autoref for schema objects, changing mentions of `unigraph.id` into references, and keep everything else untouched, without object paddings.
 * 
 */
export function processAutorefUnigraphId(orig: any) {
    function recurse(current: any) {
        switch (typeof current) {
            case "object":
                if (Array.isArray(current)) {
                    current.forEach(e => recurse(e));
                } else {
                    const kv = Object.entries(current);
                    kv.forEach(([key, value]) => {
                        if (key === "unigraph.id") {
                            // Add autoref by unigraph.id
                            current['$ref'] = {
                                query: [{key: 'unigraph.id', value: value}],
                            };
                            delete current['unigraph.id'];
                        } else {
                            recurse(value);
                        }
                    })
                }
                break;
            
            default:
                break;
        }
    }

    orig = JSON.parse(JSON.stringify(orig))

    recurse(orig);
    return orig;
}

/**
 * Traverses a given updater object and returns the difference in the form of upsert object with uid.
 * DEPRECATED: Please don't use this function as it is much slower than using dgraph native.
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

export function resolveSchemas(schemasMap: Record<string, any>) {

    function recurse() {

    }

    

}

/**
 * Decontextualize objects by replacing object UIDs with placeholder items
 * such as `_:`.
 * 
 * This is used by object importers.
 */
export function dectxObjects(objects: any[], prefix = "_:"): any[] {
    let newObjects = objects;
    let nextUid = 1;
    let uidMap: any = {};

    function recurse(currentEntity: any) {
        switch (typeof currentEntity) {
            case "object":
                if (Array.isArray(currentEntity)) {
                    currentEntity.forEach(el => recurse(el));
                } else {
                    let kvs = Object.entries(currentEntity);
                    for (let i=0; i<kvs.length; ++i) {
                        if (kvs[i][0] !== "uid") {
                            // not UID, recursing
                            recurse(kvs[i][1]);
                        } else if (typeof kvs[i][1] === "string") {
                            // key is UID, compare
                            let value = kvs[i][1] as string;
                            if (!Object.keys(uidMap).includes(value)) {
                                uidMap[value] = prefix+nextUid.toString();
                                nextUid += 1;
                            }
                            currentEntity.uid = uidMap[value];
                        }
                    }
                    // If we have unigraph.id in object we should delete the uid
                    if (Object.keys(currentEntity).includes('unigraph.id')) {
                        delete currentEntity.uid;
                    }
                }
                break;

            default:
                break;
        }
    }
    
    newObjects.forEach(obj => recurse(obj));

    return newObjects;
}

export function unpadRecurse(object: any) {
    let result: any = undefined;
    if (typeof object === "object" && !Array.isArray(object)) {
        result = {};
        const predicate = Object.keys(object).find(p => p.startsWith("_value"));
        const timestamp = Object.keys(object).find(p => p.startsWith("_timestamp"));
        if (predicate) { // In simple settings, if contains _value ignore all edge annotations
            result = unpadRecurse(object[predicate]);
        } else {
            result = Object.fromEntries(Object.entries(object).map(([k, v]) => [k, unpadRecurse(v)]));
        }
        if (object['unigraph.id']) result['unigraph.id'] = object['unigraph.id'];
        if (timestamp && typeof result === "object" && !Array.isArray(result)) result["_timestamp"] = object["_timestamp"]
    } else if (Array.isArray(object)) {
        result = [];
        object.sort((a, b) => (a["_index"]?.["_value.#i"] || 0) - (b["_index"]?.["_value.#i"] || 0));
        object.forEach(val => result.push(unpadRecurse(val)));
    } else {
        result = object;
    }
    return result;
}

export function unpad(object: any) {
    
    return {...unpadRecurse(object), uid: object.uid, type: object.type}
}

export function clearEmpties(o: any) {
    for (var k in o) {
      if (!o[k]) {
          delete o[k];
          continue
      } else if (typeof o[k] !== "object") {
        continue // If null or not an object, skip to the next iteration
      }
  
      // The property is an object
      clearEmpties(o[k]); // <-- Make a recursive call on the nested object
      if (Object.keys(o[k]).length === 0) {
        delete o[k]; // The object had no properties, so delete that property
      }
    }
  }