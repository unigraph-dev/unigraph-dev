---
updated_at: 2021-11-27T14:44:57-05:00
---
# Packages

NOTE: This is a low-level documentation about packages. For a higher abstraction of how packages (apps) are viewed in the Unigraph ecosystem, see [apps](./apps.md).

# Database-wide package metadata

There are three (3) places that package metadata is handled, namely:

## Namespace map

This is a map for all named entities within the database, including all entities with a unigraph.id predicate. It is stored at `$/meta/namespace_map`.

This namespace is used to map shorthands to the resolved package items (schemas, entities, etc). Later-added items will overwrite previous ones by default, though this is user-dependent.

## Package declaration

All packages have a declaration object. It is typed as `$/schema/package_manifest` and have the special Dgraph type attribute 'Package'.

Keys: `pkgManifest`, `pkgSchemas`, `pkgExecutables`, `pkgEntities`.

## Type resolutions

This is used to map shorthand types to all possible resolutions that takes namespace clashes into consideration.

# Creating a package

1. Create schemas for all packaged schemas
2. Create entities for all packaged entities/executables
3. Declare them in `manifest.json`