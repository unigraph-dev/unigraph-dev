# Namespaces

Namespaces can get quite messy if unmanaged. In Unigraph we use an graph-native reference-based approach with two types of namespaces: shorthand form (starting with $/schema) and package form (for example $/package/dev.unigraph.semantic/0.0.1/schema/).

We maintain a dictionary object called "$/meta/namespace_map" that links shorthand references to packages.

If you are looking for information about the canonical namespace - `unigraph.id`, see [Unigraph.id](./unigraph_id.md).

## Resolving shorthand references

To be added in next versions
## Examples
$/package/dev.unigraph.semantic/0.0.1/schema/semantic_properties -> $/schema/semantic_properties
$/package/dev.unigraph.semantic/0.0.1/schema/tag -> $/schema/tag