---
updated_at: 2021-11-27T15:06:45-05:00
---
# Namespaces

Namespaces can get quite messy if unmanaged. In Unigraph we use an graph-native reference-based approach with two types of namespaces: shorthand form (starting with `$/schema`) and package form (for example `$/package/unigraph.semantic/0.0.1/schema/`). The default namespace - `unigraph.id` - is called the canonical namespace, and is used in all examples here.

We maintain a dictionary object called `$/meta/namespace_map` that links shorthand references to packages.

For more information about the canonical namespace, see [Unigraph.id](./unigraph_id.md).

For how the sub-namespace of a package is structured, see [Apps](./apps.md).

## Resolving shorthand references

Resolving shorthand references is currently done when loading cache. 

## Examples namespace mappings
$/package/unigraph.semantic/0.0.1/schema/semantic_properties -> $/schema/semantic_properties
$/package/unigraph.semantic/0.0.1/schema/tag -> $/schema/tag
$/package/unigraph.semantic/0.0.1/executable/hello -> $/executable/hello
$/package/unigraph.semantic/0.0.1/entity/example -> $/entity/example