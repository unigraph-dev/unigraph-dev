declare type UnigraphSchemaDeclaration = {
    name: string,
    schema: any
}

declare type UnigraphContext = {
    schemas: UnigraphSchemaDeclaration[],
    defaultData: any,
}

declare type UnigraphHooks = {
    afterSchemasLoaded: (subsId: any, componentThis: any) => any,
}