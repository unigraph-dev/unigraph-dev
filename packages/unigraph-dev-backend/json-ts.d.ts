type UidType<uid extends string> = {"uid": uid}

declare function uid<idType extends string>(id: idType): UidType<idType>

type ComposerObjectIndexs = "_:primitive/string"

type PrimitiveType = {
    "_:primitive/string": string
}

// We say this is a Field "indexed by" T
type Field<T extends ComposerObjectIndexs> = {
    key: PrimitiveType[T],
    value: Definition
}

type ComposerObject<T extends ComposerObjectIndexs> = {
    type: {"uid": "_:composer/Object"},
    parameters?: {
        indexedBy: UidType<T>
    },
    properties: Field<T>[]
}

type ComposerArray = {
    type: {"uid": "_:composer/Array"},
    parameters: {
        element: Definition
    }
}

type Composers = ComposerObject<ComposerObjectIndexs> | ComposerArray
type PrimitiveTypes = {"uid": "_:primitive/string"} | {"uid": "_:primitive/number"} | {"uid": "_:primitive/boolean"}
type Primitive = {"type": PrimitiveTypes}

export type Schema = {
    "uid": string,
    definition: Definition
}

export type SchemaDgraph = Schema | {"dgraph.type": "Type"}

interface SchemaRef<T extends string> {
    type: {"uid": `_:schema/${T}`}
}

type Types = Composers | Primitive | Schema | SchemaRef<string>

export type Definition = Types

export type Entity<T extends string> = {
    "uid": string,
    type: {"uid": `_:schema/${T}`}
}

export type EntityDgraph<T extends string> = Entity<T> | {"dgraph.type": "Entity"} | Record<string, any>