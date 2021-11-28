---
updated_at: 2021-11-27T15:14:53-05:00
---
# unigraph.id

`unigraph.id` is the canonical namespace, regardless of database implementations. All `unigraph.id`s start with `$/`.

All subspaces has their own rules regarding how to form names. See respective documentations for more information.

## Examples
- `$/meta/` The meta namespace
- `$/schema/` Not actually stored. List of all shorthand schemas
- `$/package/` The package namespace
- `$/primitive/` Primitive types references and annotations
- `$/unigraph` Singular namespace object with metadata of current Unigraph installation
- `$/entity/` (not actually stored in database) the shorthand for named entities from packages
- `$/executable` (not actually stored in database) the shorthand for executable entities from packages

## Upcoming
- `$/composer/` The composer namespace, allowing for flexible data and view integration across packages

## Where do we check unigraph.id?

TODO