type UidType<uid extends string> = {"uid": uid}
type UnigraphIdType<uid extends string> = {"unigraph.id": uid}
type RefUnigraphIdType<uid extends string> = {"$ref": {"unigraph.id": uid}}

declare function uid<idType extends string>(id: idType): UidType<idType>
declare function makeUnigraphId<idType extends string>(id: idType): UnigraphIdType<idType>
declare function makeRefUnigraphId<idType extends string>(id: idType): RefUnigraphIdType<idType>

type ComposerObjectIndexs = "$/primitive/string"

type PrimitiveType = {
    "$/primitive/string": string
}

// We say this is a Field "indexed by" T
type Field<T extends ComposerObjectIndexs> = {
    key: PrimitiveType[T],
    definition: Definition
}

type ComposerObjectInstance<T extends ComposerObjectIndexs> = {
    type: RefUnigraphIdType<"$/composer/Object">,
    parameters?: {
        indexedBy: RefUnigraphIdType<T>,
        indexes: PrimitiveType[T][]
    },
    properties: Field<T>[]
}

type ComposerArrayInstance = {
    type: RefUnigraphIdType<"$/composer/Array">,
    parameters: {
        element: Definition
    }
}

type Composers = ComposerObjectInstance<ComposerObjectIndexs> | ComposerArrayInstance
type PrimitiveTypes = RefUnigraphIdType<"$/primitive/string"> | RefUnigraphIdType<"$/primitive/number"> | RefUnigraphIdType<"$/primitive/boolean">
type Primitive = {"type": PrimitiveTypes}

export type Schema = {
    "unigraph.id": string,
    definition: Definition
}

export type SchemaDgraph = Schema | {"dgraph.type": "Type"}

interface SchemaRef<T extends string> {
    type: {"$ref": {"unigraph.id": `$/schema/${T}`}}
}

type Types = Composers | Primitive | Schema | SchemaRef<string>

export type Definition = Types

export type Entity<T extends string> = {
    "uid"?: string,
    type?: RefUnigraphIdType<`$/schema/${T}`>,
    "_value": any,
    indexes?: any
}

export type EntityDgraph<T extends string> = Entity<T> | {"dgraph.type": "Entity"}