---
updated_at: 2021-11-27T14:43:17-05:00
---
# Unigraph's Schemas and Objects

This is an overview of our more comprehensive documentation on the data model. Please check out [Data Model](./data_model.md) for more.

As part of our [Goals](../goals.md), Unigraph has a user-centric, free principle about schemas and objects in a flexible graph database. 

## Data Model

We believe that our data structure should allow users to integrate all their personal information if they choose to. That's why our data model have to be more flexible than traditional [Object-relational Mappings](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). A sample object may look like this:

```typescript
function makeRefUnigraphId<IdType extends string>(id: IdType): RefUnigraphIdType<IdType> {return {"$ref":{"unigraph.id": id}}}

let todoItem: EntityDgraph<"todo"> = {
    "dgraph.type": "Entity",
    "type": makeRefUnigraphId("$/schema/todo"),
    "_value": { // `_value` predicate can be stripped away if predicate-properties don't exist
        "name": {"_value.%": "Write initial definitions of JSON-TS"},
        "done": {"_value.!": false},
        "users": {"_value": [
            {
                "_value": {"name": {"_value.%": "Jane Doe"}}, 
                "dgraph.type": "Entity", 
                "type": makeRefUnigraphId("$/schema/user")
            }
        ]}
    }
}
```

Any object has 4 basic fields:
- `uid`: An internal ID number for references. Values of this uid is dependent on the specific database implementation.
- `dgraph.type`: Used in the Dgraph type system to provide lookup functionalities of data. All objects have this field as `Entity`, so you should not worry about this field as it would be created automatically.
- `type`: Used in the Unigraph type system to provide schema enforcement, view generation, and many other awesome features.
- `_value`: Used internally to provide flexibility in data model (for example, predicate-properties). You can choose to strip it away (making values the same level as other fields, similar to regular object representations of data) if you don't need predicate-properties.

You can configure additional arbitrary metadata as you prefer. see [metadata](../app_design/entity_data_and_metadata.md)

## References

Please see the section [Data model](./data_model.md) for more information.

## Predicates / Fields

Here are the rules to naming predicates:
- Predicates can be named in any language as we use UTF-8 encoding by default.
- Per Dgraph requirements, predicates cannot include the following special characters: ``^}|{`\~``. See Dgraph [Docs](https://dgraph.io/docs/query-language/schema/#forbidden-special-characters).
- Predicates starting with `_` and `$` are reserved by Unigraph; so custom predicates cannot start with these characters.