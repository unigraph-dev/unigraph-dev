import { Schema, SchemaDgraph } from "./json-ts";

export type PackageManifest = {
    /** Display name for your package that the users would see. */
    pkgDisplayName: string,
    /** Package name for your package for indexes. */
    pkgPackageName: string,
    /** Version of your package, similar to that of npm packages. */
    pkgVersion: string,
    /** Short description for your package for users to read. */
    pkgDescription: string,
    /** A dictionary whose keys are shorthand notations and values schema references. See namespaces.md for more info. */
    pkgSchemaMaps?: Record<string, string>
}

export type PackageDeclaration = {
    pkgManifest: PackageManifest,
    pkgSchemas: Record<string, Schema | SchemaDgraph>
}