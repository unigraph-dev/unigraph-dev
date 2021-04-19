# Namespaces

Namespaces can get quite messy if unmanaged. In Unigraph we use an graph-native reference-based approach with two types of namespaces: shorthand form (starting with $/schema) and package form (for example $/package/dev.unigraph.semantic/0.0.1/schema/).

We maintain a dictionary object called "$/meta/namespace_map" that links shorthand references to packages.

## Resolving shorthand references


## Examples
$/package/dev.unigraph.semantic/0.0.1/schema/semantic_properties -> $/schema/semantic_properties
$/package/dev.unigraph.semantic/0.0.1/schema/tag -> $/schema/tag