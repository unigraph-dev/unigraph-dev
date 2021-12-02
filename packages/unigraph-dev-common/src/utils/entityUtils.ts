// FIXME: This file is too large! Either break it up or add synopsis here.

import { jsonToGraphQLQuery } from "json-to-graphql-query";
import _ from "lodash";
import { buildGraph } from "../utils/utils";
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

type BuildEntityOptions = {validateSchema: boolean, isUpdate: boolean, states: any, globalStates: any}
type PropertyDescription = Partial<Field<any>>

/* Schema checking spec list:
 * - should be able to check basic objects (restrictive schema, nonabstract, unpadded)
 * - should be able to check nonrestrictive objects (i.e. fields don't exist on schema)
 * - should be able to check padded objects
 */

export function isTypeAlias(localSchema: Record<string, any>, rawPartUnigraphType: UnigraphTypeString): boolean {
    return (localSchema?.type['unigraph.id'] === rawPartUnigraphType) && (!rawPartUnigraphType.startsWith('$/composer/'));
}

function isUnion(schemaString: string, schemaMap: Record<string, any>): boolean {
    if (!schemaString) return false;
    return schemaString.startsWith('$/schema/interface') || schemaString === "$/composer/Union" || isUnion(schemaMap[schemaString]?.type?.['unigraph.id'], schemaMap)
}

function isRef (rawPart: any) {
    return (Object.keys(rawPart).length === 1 && typeof rawPart.uid === "string" && rawPart.uid.startsWith("0x")) ||
        (Object.keys(rawPart).length === 1 && typeof rawPart['unigraph.id'] === "string" && rawPart['unigraph.id'].startsWith("$/"))
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
    const rawPartUnigraphType = getUnigraphType(rawPart, localSchema?.type?.['unigraph.id']);
    //console.log(localSchema, rawPart)

    if (localSchema.type?.['unigraph.id'] === "$/schema/any" && typeof rawPart?.type?.['unigraph.id'] === "string") {
        // If schema is any object and the object has a type (that we can check), 
        // we allow any rawPart by setting localSchema type to that of object.
        localSchema = JSON.parse(JSON.stringify(localSchema));
        localSchema.type['unigraph.id'] = rawPart.type['unigraph.id'];
    } else if (localSchema.type?.['unigraph.id'] === "$/schema/any" && !(isRef(rawPart))) {
        throw new TypeError('`$/schema/any` directive must have a corresponding type declaration in object!')
    }

    if (rawPart?.type?.['unigraph.id'] && schemaMap[rawPart.type['unigraph.id']]?.['_definition'] && 
        (rawPart?.type?.['unigraph.id'] === localSchema.type?.['unigraph.id'] || localSchema.type?.['unigraph.id'] === "$/schema/any")) {
        const userType = rawPart.type;
        delete rawPart.type;
        unigraphPartValue = buildUnigraphEntity((rawPart['_value'] || rawPart['_value'] === '') ? rawPart['_value'] : rawPart, userType['unigraph.id'], schemaMap, true, options, propDesc);
    } else try {
        // Check for localSchema accordance
        if (rawPart && isRef(rawPart)) {
            // Is UID reference, don't check for accordance
            unigraphPartValue = rawPart;
        } else if (localSchema.type?.['unigraph.id'] === rawPartUnigraphType) {
            // Case 1: Entity type == schema type. This is straightforward
            switch (rawPartUnigraphType) {
                case "$/composer/Array":
                    predicate = "_value["
                    /* eslint-disable */ // Dependent recursive behavior
                    const newLocalSchema1 = localSchema['_parameters']['_element'];
                    unigraphPartValue = rawPart.map((el: any, index: number) => {
                        let context = {};
                        if (el['$parentcontext']) {
                            context = el['$parentcontext'];
                            delete el['$parentcontext'];
                        }
                        return {
                            ...buildUnigraphEntityPart(el, options, schemaMap, newLocalSchema1), 
                            _index: {"_value.#i": index},
                            ...context
                        }
                    });
                    unigraphPartValue = {
                        ...propDesc,
                        "type": {
                            "unigraph.id": "$/composer/Array"
                        },
                        [predicate]: unigraphPartValue
                    }
                    noPredicate = true;
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
                        let context = {};
                        if (value['$parentcontext']) {
                            context = value['$parentcontext'];
                            delete value['$parentcontext'];
                        }
                        const propDesc: PropertyDescription = _.pickBy({_propertyType: keysMap[key]._propertyType}, _.identity)
                        if (!localSchema) throw new TypeError("Schema check failure for object: " + JSON.stringify(rawPart));
                        unigraphPartValue[key] = {...buildUnigraphEntityPart(value, options, schemaMap, localSchema, propDesc), ...context};
                        if (typeof keysMap[key]?.['_indexAs'] === "string") {
                            const linkUid = unigraphPartValue[key]['uid'] || "_:link" + (options.globalStates.nextUid++)
                            unigraphPartValue[key]['uid'] = linkUid;
                            options.states.indexes[keysMap[key]['_indexAs']] = {uid: linkUid}
                        }
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
        } else if (localSchema.type?.['unigraph.id']?.startsWith('$/schema/') && rawPartUnigraphType) {
            // Case 2.1: References another schema with primitive type (still needs predicate to indicate reference)
            unigraphPartValue = buildUnigraphEntity(rawPart, localSchema.type['unigraph.id'], schemaMap, true, options, propDesc);
        } else if (localSchema.type && isTypeAlias(schemaMap[localSchema.type['unigraph.id']]?._definition, rawPartUnigraphType)) {
            // Case 2.5: Is type alias (return unigraph object but keeps relationship)
            unigraphPartValue = buildUnigraphEntity(rawPart, localSchema.type['unigraph.id'], schemaMap, true, options, propDesc);
        } else if (localSchema.type?.['unigraph.id']?.startsWith('$/composer/Union')) {
            // Case 3: Local schema is a union: we should compare against all possible choices recursively
            noPredicate = true;
            let unionSchema = localSchema as ComposerUnionInstance;
            let definitions = unionSchema._parameters._definitions;
            if (rawPart?.type?.['unigraph.id']) {
                const userType = rawPart.type;
                if (Object.keys(rawPart).length === 2 && typeof rawPart.uid === "string" && rawPart.uid.startsWith('0x')) delete rawPart.type;
                definitions = unionSchema._parameters._definitions.filter((el: any) => el.type['unigraph.id'] === userType['unigraph.id'])
                //rawPart = (rawPart['_value'] || rawPart['_value'] === '') ? rawPart['_value'] : rawPart;
            }
            let choicesResults = (_.uniqBy(definitions, "uid")).map(defn => {
                try {
                    return [defn, buildUnigraphEntityPart(rawPart, options, schemaMap, defn)]
                } catch (e) {console.log(e.message || e); return undefined};
            }).filter(x => x !== undefined);
            if (choicesResults.length !== 1 && rawPartUnigraphType !== "$/primitive/undefined") {
                throw new TypeError("Union type does not allow ambiguous or nonexistent selections!" + JSON.stringify(rawPart) + JSON.stringify(localSchema) + rawPartUnigraphType + "\navailable types: " + definitions.map((el: any) => el?.type?.['unigraph.id'] + " ") + "\n\n")
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
export function buildUnigraphEntity (raw: Record<string, any>, schemaName = "any", schemaMap: Record<string, Schema>, padding = true, options: BuildEntityOptions = {validateSchema: true, isUpdate: false, states: {}, globalStates: {}}, propDesc: any = {}): EntityDgraph<string> | TypeError {
    // initialize states
    // @ts-expect-error: overwriting options
    options = {validateSchema: true, isUpdate: false, states: {}, globalStates: {}, ...options}
    if (!options?.globalStates?.nextUid) options.globalStates.nextUid = 0;
    if (!options?.states?.indexes || propDesc?.['_propertyType'] !== "inheritance") {
        const globalStates = options.globalStates;
        options = JSON.parse(JSON.stringify(options));
        options.states.indexes = {};
        options.globalStates = globalStates;
    }
    // Check for unvalidated entity
    if (padding === false && !validatePaddedEntity(raw)) {
        throw new TypeError("Entity validation failed for entity " + raw)
    } else {
        const localSchema = schemaMap[schemaName]._definition
        const unigraphId = raw?.['unigraph.id'];
        if (unigraphId) delete raw?.['unigraph.id'];
        let timestamp: any = {}; let context: any = {};
        if (raw._timestamp) {
            timestamp = raw._timestamp;
            delete raw._timestamp;
        }
        if (raw['$context']) {
            context = raw['$context'];
            delete raw['$context'];
        }
        const bodyObject: Record<string, any> = padding ? buildUnigraphEntityPart(raw, options, schemaMap, localSchema, {}) : raw
        const now = new Date().toISOString();
        timestamp = {_updatedAt: now, ...timestamp};
        if (!options.isUpdate && !timestamp._createdAt) timestamp._createdAt = now;
        const result = {
            "type": makeUnigraphId(schemaName) as UnigraphIdType<`$/schema/${string}`>,
            "dgraph.type": "Entity",
            ...bodyObject,
            "_timestamp": timestamp,
            ...propDesc,
            ...context,
            "unigraph.indexes": options.states.indexes
        };
        if (result.type?.['unigraph.id']?.startsWith('$/schema/interface')) result['dgraph.type'] = 'Interface'
        // @ts-ignore
        if (unigraphId) result['unigraph.id'] = unigraphId;
        if (schemaMap[schemaName]._hide) result['_hide'] = true;
        //console.log(JSON.stringify(result, null, 4));
        // @ts-ignore
        return result;
    }
}

export function makeQueryFragmentFromType(schemaName: string, schemaMap: Record<string, any>, maxDepth = 15, toString = true) {

    const timestampQuery = {
        _timestamp: {
            _updatedAt: {},
            _createdAt: {}
        }
    };

    function removeDups (entries: any) {
        if (entries['expand(_userpredicate_)']) {
            Object.keys(entries).forEach(el => {if (el !== "uid" && el !== "expand(_userpredicate_)" && el !== "unigraph.id") delete entries[el]})
        }
    }

    function makePart(localSchema: Definition | any, depth = 0, isRoot = false, uidOnly = false) {
        if (depth > maxDepth) return {};
        let entries: any = {"uid": {}, "unigraph.id": {}, 'type': { "unigraph.id": {} }};
        if (!localSchema?.type?.["unigraph.id"]) return {};
        let type = localSchema.type["unigraph.id"];

        if (type === '$/schema/any') {
            entries = { "uid": {}, "unigraph.id": {}, "expand(_userpredicate_)": makePart(localSchema, depth+1) }
        } else if (type.startsWith('$/schema/')) {
            entries = _.merge(entries, {"_value": makePart(schemaMap[type]._definition, depth+1, true)})
        };
        switch (type) {
            case "$/composer/Object":
                /* eslint-disable */ // Dependent recursive behavior
                const properties = localSchema._properties.map((p: any) => {
                    if (!p._isDetailed) {
                        let ret: any = {}; ret[p._key] = makePart(p._definition, depth+1);
                        return ret
                    } else {
                        let ret: any = {}; ret[p._key] = makePart(p._definition, depth+1, false, true);
                        return ret
                    }
                })
                entries = _.merge(entries, {"_value": _.merge({}, ...properties)});
                break;

            case "$/composer/Union":
                /*
                let defn = localSchema as ComposerUnionInstance;
                const options = defn._parameters._definitions.map(defnel => {
                    let children: any = makePart(defnel, depth+1)
                    entries = _.merge(entries, children);
                    //console.log(children)
                });
                entries = {"_value": entries}*/
                entries = { "uid": {}, "unigraph.id": {}, "expand(_userpredicate_)": makePart({type: {'unigraph.id': '$/schema/any'}}, depth+1) }
                break;

            case "$/composer/Array":
                entries = _.merge({}, {"<_value[>": {
                    ...makePart(localSchema._parameters._element, depth+1), 
                    "<_index>": { "<_value.#i>": {}, "<_value.#>": {} }
                }});
                if(!entries['unigraph.id']) entries['unigraph.id'] = {};
                if(!entries['uid']) entries['uid'] = {};
                if(!entries['type'] && !entries['expand(_userpredicate_)']) entries['type'] = {"unigraph.id": {}};
                break;
            
            case "$/primitive/string":
                if (!uidOnly) entries["<_value.%>"] = {};
                break;

            case "$/primitive/datetime":
                if (!uidOnly) entries["<_value.%dt>"] = {};
                break;
                
            case "$/primitive/boolean":
                if (!uidOnly) entries["<_value.!>"] = {};
                break;
                
            case "$/primitive/number":
                if (!uidOnly) entries["<_value.#>"] = {};
                if (!uidOnly) entries["<_value.#i>"] = {};
                break;

            default:
                break;
        }
        if (isRoot && !entries['expand(_userpredicate_)']) _.merge(entries, timestampQuery)
        removeDups(entries); if (entries['<_value[>']) removeDups(entries['<_value[>'])
        return entries;
    }
    const localSchema = schemaMap[schemaName]._definition;
    let res = makePart(localSchema, 0, true)
    //console.log(JSON.stringify(res, null, 4))
    let ret = toString ? "{" + jsonToGraphQLQuery(res) + "}" : res
    return ret;
}

function unpadValue(something: any) {
    if (typeof something !== "object") return something
    const kvs = Object.entries(something)
    let ret = something
    kvs.forEach(([key, value]) => {if(key.startsWith('_value')) ret = value})
    return ret
}

function getKey(object: any, key: string) {return object['_value'][key]}

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
        //console.log("=====================")
        let currentType: any;
        if (currentEntity.type?.['unigraph.id']?.includes('$/schema/')) {
            localSchema = schemas[currentEntity.type['unigraph.id']]._definition
            currentType = currentEntity.type?.['unigraph.id'];
        }
        //console.log(JSON.stringify(currentEntity), JSON.stringify(localSchema))
        const paddedEntity = currentEntity;
        currentEntity = unpadValue(currentEntity);
        if (paddedEntity?.type) recurse(paddedEntity.type, schemas, localSchema) // Check for type references as well 
        //console.log(localSchema, JSON.stringify(currentEntity))
        if (currentEntity?.type?.['unigraph.id'] && currentEntity.type['unigraph.id'] !== paddedEntity?.type?.['unigraph.id']) 
            recurse(currentEntity, schemas, schemas[currentEntity?.type?.['unigraph.id']]['_definition'])
        switch (typeof currentEntity) {
            case "object":
                if (localSchema.type?.['unigraph.id']?.startsWith('$/schema/')) {
                    localSchema = schemas[localSchema.type['unigraph.id']]._definition
                }
                //console.log(localSchema, currentEntity)
                if (Array.isArray(currentEntity) && localSchema['type']?.['unigraph.id'] === "$/composer/Array") {
                    currentEntity.forEach(e => recurse(unpadValue(e), schemas, localSchema['_parameters']['_element']));
                } else if (localSchema?.type?.['unigraph.id'] === "$/composer/Object" || Object.keys(currentEntity).includes('unigraph.id')) {
                    // Is object, check for various stuff

                    // 1. Can we do autoref based on reserved words?
                    const kv = Object.entries(currentEntity);
                    const keysMap = localSchema?.['_properties']?.reduce((accu: any, now: any) => {
                        accu[now["_key"]] = now;
                        return accu;
                    }, {}) || {} // TODO: Redundent code, abstract it somehow!
                    
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
                                        ...(currentType ? [{key: "type/unigraph.id", value: currentType}] : []) // Select current schemas only
                                    ],
                                };
                                //currentEntity[key] = undefined; - shouldn't remove the reference. let dgraph match mutations.
                            }
                            const hasType = value && (value as any)?.type !== undefined
                            recurse(unpadValue(value), schemas, localSchema["_definition"]);
                            if (hasType) recurse((value as any).type, schemas, localSchema)
                        } else if (typeof value === "object" && (value as any)?.type?.['unigraph.id']) {
                            try {
                                recurse(unpadValue(value), schemas, schemas[(value as any)?.type?.['unigraph.id']]['_definition'])
                            } catch (e) {
                                console.error(value)
                                throw e;
                            }
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
        } else if (typeof origNow == 'object' && Array.isArray(origNow) && !Array.isArray(updaterNow)) {
            // Updating a list type with a singular item - following Dgrpah's syntax we just treat it as a new object.
            return updaterNow;
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
                    let deleteThis = false;
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
                            } else {
                                // UIDMap already having such a value, this means that the current uid is a duplicate
                                deleteThis = true;
                            }
                            currentEntity.uid = uidMap[value];
                        }
                    }
                    if (deleteThis) {
                        // TODO: fix dedup
                        //kvs.forEach(([k, v]: any) => {if (k !== "uid") {
                        //    delete currentEntity[k];
                        //}})
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

export const byElementIndex = (a: any, b: any) => (a["_index"]?.["_value.#i"] || 0) - (b["_index"]?.["_value.#i"] || 0)

export const byUpdatedAt = (a: any, b: any) => (new Date((a["_timestamp"]?.["_updatedAt"] || 0))).getTime() - (new Date((b["_timestamp"]?.["_updatedAt"] || 0))).getTime()

export function unpadRecurse(object: any, visitedUids: any[] = []) {
    let result: any = undefined;
    if (object?.uid && visitedUids.includes(object.uid)) return {uid: object.uid};
    if (typeof object === "object" && !Array.isArray(object)) {
        result = {};
        let newVisited = object['uid'] ? [...visitedUids, object['uid']] : visitedUids
        const predicate = Object.keys(object).find(p => p.startsWith("_value"));
        const timestamp = Object.keys(object).find(p => p.startsWith("_timestamp"));
        if (predicate) { // In simple settings, if contains _value ignore all edge annotations
            result = unpadRecurse(object[predicate], newVisited);
        } else {
            result = Object.fromEntries(Object.entries(object).map(([k, v]) => [k, unpadRecurse(v, newVisited)]));
        }
        if (object['unigraph.id']) result['unigraph.id'] = object['unigraph.id'];
        if (timestamp && typeof result === "object" && !Array.isArray(result)) result["_timestamp"] = object["_timestamp"]
    } else if (Array.isArray(object)) {
        result = [];
        object.sort(byElementIndex);
        object.forEach(val => result.push(unpadRecurse(val, visitedUids)));
    } else {
        result = object;
    }
    return result;
}

export function unpad(object: any, withType = true) {
    
    return {...unpadRecurse(object, []), uid: object?.uid, ...(withType ? {type: object?.type} : {})}
}

export function clearEmpties(o: any) {
    for (var k in o) {
      if (typeof o[k] === "undefined" || o[k] === null) {
          delete o[k];
          continue
      } else if (typeof o[k] !== "object") {
        continue // If null or not an object, skip to the next iteration
      }
  
      // The property is an object
      clearEmpties(o[k]); // <-- Make a recursive call on the nested object
      if (Object.keys(o[k]).length === 0 && JSON.stringify(o[k]).length <= 2) {
        delete o[k]; // The object had no properties, so delete that property
      }
    }
  }

export function isPaddedObject(obj: any) {
    let valueKeysCount = 0;
    Object.keys(obj).forEach(key => {if (key.startsWith("_value")) valueKeysCount ++;})
    return valueKeysCount === 1;
}

export function prepareExportObject(obj: any, exportSchemas: boolean) {

    function recurse(curr: any) {
        switch (typeof curr) {
            case "object":
                if (Array.isArray(curr)) {
                    curr.forEach(el => recurse(el));
                } else {
                    if (curr.type) {
                        curr.type = {"unigraph.id": curr.type["unigraph.id"]};
                    }
                    curr = Object.fromEntries(Object.entries(curr).map(([k, v]) => [k, recurse(v)]));
                }
                break;
        
            default:
                break;
        }
    }

    obj = JSON.parse(JSON.stringify(obj));
    recurse(obj);
    return obj;
}

/**
 * Edit the objects for export.
 */
export function prepareExportObjects(objects: any[], exportSchemas: boolean = false) {
    return objects.map(it => prepareExportObject(it, exportSchemas))
}

export function buildGraphFromMap(objs: any) {
    const ret = buildGraph(Object.values(objs));
    return Object.fromEntries(Object.keys(objs).map((el, index) => [el, ret[index]]))
}

export function flatten(objs: any[]) {

    let entities: any = {}

    function flattenRecurse(curr: any) {
        if (typeof curr === "object" && curr && Array.isArray(curr)) {
            curr.forEach(flattenRecurse);
        } else if (typeof curr === "object" && curr) {
            if (curr.uid && (curr['dgraph.type']?.includes?.('Entity') || curr['dgraph.type']?.includes?.('Interface'))) {
                // Flatten entities
                if (!entities[curr.uid]) entities[curr.uid] = curr;
                else Object.keys(curr).forEach(el => {if (el !== "uid") delete curr[el];});
            }
            // Remove type
            if (curr['type']?.['dgraph.type']?.includes('Type')) {
                delete curr['type']['_value['];
                delete curr['type']['uid'];
                delete curr['type']['dgraph.type'];
            }
            // Continue recursion
            Object.values(curr).forEach(flattenRecurse)
        }
        // If primitive, don't recurse anymore
    }

    objs.forEach(flattenRecurse);

    return entities;

}

export function unflatten(objsMap: any, targets: string[]) {

    function unflattenRecurse(curr: any, target: string) {
        if (typeof curr === "object" && curr && Array.isArray(curr)) {
            curr.forEach((el: any) => unflattenRecurse(el, target));
        } else if (typeof curr === "object" && curr) {
            Object.entries(curr).forEach(([key, value]: any) => {
                if (value.uid && objsMap[value.uid] && !targets.includes(value.uid)) {
                    curr[key] = objsMap[value.uid];
                    unflattenRecurse(curr[key], target)
                } else unflattenRecurse(curr[key], target)
            })
        }
    }

    targets.forEach(el => unflattenRecurse(objsMap[el], el));
    return targets.map(el => objsMap[el]);
}