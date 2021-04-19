# Glossary

Here is a list of uncommon terms we use in Unigraph, both in source code and user interface, that might be helpful to understanding the system.

## autoref

Since the explicit referencing method can be cumbersome and not always consistent with user-defined custom indexes, we also offer an alternative method using schema definition automatically, called Autoref.

## (object) padding

To represent complex hypergraphical relationships (including edge annotations, metadata) and to embrace the philosophy that edges and morphisms should also be considered as objects, we added object padding in our data model. In summary, instead of using the basic key-value model of data, we use `_value*` keywords to add extra depth and flexibility to relationships. For more information see [Data model](./data_model.md)

## shorthand

A shorthand is a shorter notation when dealing with schema compatibilities, like `$/schema/todo`. For more information see [Namespaces](./namespaces.md)