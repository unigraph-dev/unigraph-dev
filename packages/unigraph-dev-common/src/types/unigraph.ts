import { PackageDeclaration } from "./packages"
import { Unigraph } from "../api/unigraph";

export type UnigraphSchemaDeclaration = {
    name: string,
    schema: any
}

export type UnigraphContext = {
    schemas: UnigraphSchemaDeclaration[],
    packages: PackageDeclaration[],
    defaultData: any,
}

export type UnigraphHooks = {
    afterSchemasLoaded: (subsId: any, data: any, componentThis: any) => any,
}

export type UnigraphExecutable<T = any> = (
    context: {params: T},
    unigraph: Unigraph
) => any

export type UnigraphNotification = {
    name: string,
    from: string,
    content: string,
    actions: any[]
}