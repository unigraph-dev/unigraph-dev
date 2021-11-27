---
updated_at: 2021-11-27T14:56:29-05:00
---
# Data Model and Graphs

Unigraph provides a graph-centric approach to data modeling (in comparison to conventional object-based models). As a result, there are some caveats and key differences which will be covered in this documentation.

# References

Since we use a graph model for data representation, it is common for an object to refer another object for a specific field. For example, an abstract model for a company might refer a specific field in an annual report in that company. Internally in the graph database, all nested object layers are separate nodes with unique UIDs.

In Unigraph, and the underlying graph engines (such as Dgraph), references are first-class citizens - that is achieved through the fact that we don't discern nested objects with referenced objects - the only difference is that standalone objects (like those in a traditional object data model) are given the type 'Entity' while parts of an object aren't.

References to other nodes (we currently support entities only, but will eventually add support for any child node too) can be done in two ways: either by explicit references or by Autoref.

## Referencing using the `$ref` keyword

Explicit references are done via the `$ref` keyword as demonstrated below.

```typescript
{
    ...
    "earnings": {
        "2015-Q2": { // This is the reference object
            "$ref": {
                "query": [{
                    "key": "name",
                    "value": "annual-report-2015"
                }]
            }
        } // Above is the reference object
    }
    ...
}
```

## Contextual metadata using the `$context` and `$parentcontext` keywords

You can also use the `$context` and `$parentcontext` keywords to define contextual metadata.

Example: 

```typescript
window.unigraph.updateObject(data.uid, {
        "children": [{
            "type": {"unigraph.id": "$/schema/subentity"},
            "_value": {
                "type": {"unigraph.id": "$/schema/note_block"},
                "_value": {
                    "text": {
                        "type": {"unigraph.id": "$/schema/markdown"},
                        "_value": ""
                    },
                    "$context": { //this maps to the note_block object
                        "_hide": true
                    }
                },
                "$context": { // this maps to the subentity object
                    "_hide": true
                },
            }
        }]
    });
```

This will add a note block to an entity as a subentity, while designating both the subentity and the note block to have the `_hide` metadata attribute.


## Referencing with Autoref

Since the explicit referencing method can be cumbersome and not always consistent with user-defined custom indexes, we also offer an alternative method using schema definition automatically, called Autoref.

When defining the schema, one can use the `unique: true` identifier in any `Field` (see the Typescript declaration for more context for now) to specify unique identifiers to keep and reference automatically if the same name already existed.

For example, in schema declaration:

```typescript
{
    "key": "name",
    "definition": {
        "type": makeRefUnigraphId("$/primitive/string")
    },
    "unique": true,
}
```

Now, all newly created objects with this schema will be merged with existing objects with the same `name`. This is done efficiently in the current graph database backend (Dgraph) via the upsert operation.

## Caveats
- Currently we only support top-level referencing and autoref. We will support nested references very soon.

# Object Updates

The server event `update_object` accepts two arguments, the `uid` of the object to update, and the new object with entries being the changed ones, called the updater. The updater should be unpadded - though we can make it work for padded in a future update.

## Example

We have this exising object:
```typescript
{
  "name": "hihihi",
  "done": false,
  "users": [
    {
      "uid": "0x1f"
    }
  ],
  "uid": "0x1b"
}
```

and updater:
```typescript
{ "done": true }
```

yields the following upsert object:
```typescript
{
  "uid": "0x1b",
  "type": {
    "uid": "0x12"
  },
  "_value": {
    "uid": "0x21",
    "done": {
      "uid": "0x22",
      "_value.!": true
    }
  }
}
```

# Object Deletion

* Unlike conventional NoSQL systems, Unigraph cannot be sure of which parts of an object that should be deleted. For example, if the user tries to delete a todo object, the reference to the owner of that object (a user) should not be deleted; while the reference to its notes should be. Although we provide ways to declare them in the schema, 

# (object) padding

To represent complex hypergraphical relationships (including edge annotations, metadata) and to embrace the philosophy that edges and morphisms should also be considered as objects, we added object padding in our data model. In summary, instead of using the basic key-value model of data, we use `_value*` keywords to add extra depth and flexibility to relationships.

## Advantages

- Easy metadata and edge annotation support
- Clear seperations of references and entries
- Atomic and composable data structure
- Ability to treat edges as objects intrinsiclly.

## Disadvantages

- Less readable out of the box - please use the 'data model playground' if you want to work with padded objects.