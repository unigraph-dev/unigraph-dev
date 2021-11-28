---
updated_at: 2021-11-27T15:14:54-05:00
---
# Glossary

Here is a list of uncommon terms we use in Unigraph, both in source code and user interface, that might be helpful to understanding the system.

## autoref

Since the explicit referencing method can be cumbersome and not always consistent with user-defined custom indexes, we also offer an alternative method using schema definition automatically, called Autoref.

## (object) padding

To represent complex hypergraphical relationships (including edge annotations, metadata) and to embrace the philosophy that edges and morphisms should also be considered as objects, we added object padding in our data model. In summary, instead of using the basic key-value model of data, we use `_value*` keywords to add extra depth and flexibility to relationships. For more information see [Data model](./data_model.md)

## shorthand

A shorthand is a shorter notation when dealing with schema compatibilities, like `$/schema/todo`. For more information see [Namespaces](./namespaces.md)

## executable

An entity with underlying type `Executable` (i.e. `dgraph.type: ['Entity', 'Executable']`) can be `eval`-ed in the user scope. This is dangerous from a security perspective, and we're currently planning on changing it. See more: [Executables](./executables.md).

## apps and packages

An app is something similar to the level of development needed for a Firebase app - and a package is an app without user interfaces: it can be a supporting package for other apps, or just some background functions that are run on the server.

## DQL

DQL is the underlying query language of our current graph database, dgraph. We're using a fork of its codebase so additional commands in DQL beyond the offical documentation are supported. For more info, check out [dgraph](./dgraph.md)