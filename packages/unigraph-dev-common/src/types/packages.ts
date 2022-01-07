import { Schema, SchemaDgraph } from './json-ts';

export type PackageManifest = {
    /** Display name for your package that the users would see. */
    name: string;
    /** Package name for your package for indexes. */
    package_name: string;
    /** Version of your package, similar to that of npm packages. */
    version: string;
    /** Short description for your package for users to read. */
    description: string;
};

export type PackageDeclaration = {
    pkgManifest: PackageManifest;
    pkgSchemas: Record<string, Schema | SchemaDgraph>;
    pkgExecutables?: Record<string, any>;
    pkgEntities?: Record<string, any>;
};
