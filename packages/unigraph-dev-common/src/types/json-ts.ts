export type UidType<uid extends string> = {"uid": uid}
export type UnigraphIdType<uid extends string> = {"unigraph.id": uid}
export type RefUnigraphIdType<uid extends string = string> = {"$ref": {"query": [{"key": "unigraph.id", "value": uid}]}}

declare function uid<IdType extends string>(id: IdType): UidType<IdType>
declare function makeUnigraphId<IdType extends string>(id: IdType): UnigraphIdType<IdType>
declare function makeRefUnigraphId<IdType extends string>(id: IdType): RefUnigraphIdType<IdType>

export type ComposerObjectIndexs = "$/primitive/string"

export type PrimitiveType = {
    "$/primitive/string": string
}

// We say this is a Field "indexed by" T
export type Field<T extends ComposerObjectIndexs> = {
    key: PrimitiveType[T],
    unique?: boolean,
    definition: Definition
}

export type ComposerObjectInstance<T extends ComposerObjectIndexs> = {
    type: UnigraphIdType<"$/composer/Object">,
    parameters?: {
        indexedBy: UnigraphIdType<T>,
        indexes: PrimitiveType[T][]
    },
    properties: Field<T>[]
}

export type ComposerArrayInstance = {
    type: UnigraphIdType<"$/composer/Array">,
    parameters: {
        element: Definition
    }
}

export type ComposerUnionInstance = {
    type: UnigraphIdType<"$/composer/Union">,
    parameters: {
        definitions: Definition[]
    }
}

export type UnigraphPrimitiveTypeString = "$/primitive/number" | "$/primitive/boolean"
| "$/primitive/string" | "$/primitive/null"
export type UnigraphTypeString = UnigraphPrimitiveTypeString | "$/composer/Array" | "$/composer/Object" | "$/primitive/undefined"

export type Composers = ComposerObjectInstance<ComposerObjectIndexs> | ComposerArrayInstance | ComposerUnionInstance
export type PrimitiveTypes = UnigraphIdType<UnigraphPrimitiveTypeString>
export type Primitive = {"type": PrimitiveTypes}



export type Schema = {
    "unigraph.id"?: string,
    definition: Definition
}

export type SchemaDgraph = {
    "unigraph.id"?: string,
    definition: Definition,
    "dgraph.type": "Type"
}

export interface SchemaRef<T extends string> {
    type: UnigraphIdType<`$/schema/${T}`>
}

export type Types = Composers | Primitive | Schema | SchemaRef<string>

export type Definition = Types

export type Entity<T extends string> = {
    "uid"?: string,
    type?: UnigraphIdType<`$/schema/${T}`>,
    "_value": any,
    'unigraph.id'?: string
}

export type EntityDgraph<T extends string> = Entity<T> | {"dgraph.type": "Entity"}

