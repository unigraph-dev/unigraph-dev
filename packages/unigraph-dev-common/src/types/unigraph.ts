import { PackageDeclaration } from "./packages"

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