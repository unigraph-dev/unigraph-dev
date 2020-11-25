# Unigraph's Schemas and Objects

As part of our [Goal](./goal.md), Unigraph has a user-centric, free principle about schemas and objects in a flexible graph database. 

## Data Model

We believe that our data structure should allow users to integrate all their personal information if they choose to. That's why our data model have to be more flexible than traditional [Object-relational Mappings](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). A sample object may look like this:

```typescript
function makeRefUnigraphId<IdType extends string>(id: IdType): RefUnigraphIdType<IdType> {return {"$ref":{"unigraph.id": id}}}

let todoItem: EntityDgraph<"todo"> = {
    "uid": "0x01",
    "dgraph.type": "Entity",
    "type": makeRefUnigraphId("$/schema/todo"),
    "_value": { // `_value` predicate can be stripped away if predicate-properties don't exist
        "name": {"_value": "Write initial definitions of JSON-TS"},
        "done": {"_value": false},
        "users": {"_value": [
            {
                "_value": {"name": {"_value": "Haoji Xu"}}, 
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

## References

Since we use a graph model for data representation, it is common for an object to refer another object for a specific field. For example, an abstract model for a company might refer a specific field in an annual report in that company. Internally in the graph database, all nested object layers are separate nodes with unique UIDs, and can be referenced easily using the reference syntax.

A reference in the data model might look like this:

```typescript
{
    ...
    "earnings": {
        "2015-Q2": { // This is the reference object
            "$ref": {
                "name": "annual-report-2015"
            }
        } // Above is the reference object
    }
    ...
}
```

A reference definition in schemas might look like this:

TODO

If the data were to be inserted to Unigraph, it would be transformed to an upsert operation which first query to the database searching for the `name` predicate, then the reference object would be replaced by a link to the query result.

Notes:
- The referenced field must be an indexed predicate in the database implementation (Dgraph). You can change this by a TODO operation.
- Currently we don't have nested reference yet, but it would be added in the future TODO.

## Predicates / Fields

Here are the rules to naming predicates:
- Predicates can be named in any language as we use UTF-8 encoding by default.
- Per Dgraph requirements, predicates cannot include the following special characters: ``^}|{`\~``. See Dgraph [Docs](https://dgraph.io/docs/query-language/schema/#forbidden-special-characters).
- Predicates starting with `_` and `$` are reserved by Unigraph; so custom predicates cannot start with these characters.

## Schemas
TODO