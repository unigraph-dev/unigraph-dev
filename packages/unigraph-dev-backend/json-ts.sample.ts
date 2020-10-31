import { SchemaDgraph, UidType, EntityDgraph } from "./json-ts";

function uid<idType extends string>(id: idType): UidType<idType> {return {"uid": id}}

let todoSchema: SchemaDgraph = {
    ...uid("_:schema/todo"),
    "dgraph.type": "Type",
    "definition": {
        "type": uid("_:composer/Object"),
        "parameters": {
            "indexedBy": uid("_:primitive/string"),
        },
        "properties": [
            {
                "key": "name",
                "value": {
                    "type": uid("_:primitive/string")
                }
            },
            {
                "key": "done",
                "value": {
                    "type": uid("_:primitive/boolean")
                }
            },
            {
                "key": "users",
                "value": {
                    "type": uid("_:composer/Array"),
                    "parameters": {
                        "element": {"type": uid("_:schema/user")}
                    }
                }
            }
        ]
    }
}

let todoItem: EntityDgraph<"todo"> = {
    "uid": "0x01",
    "dgraph.type": "Entity",
    "type": uid("_:schema/todo"),
    "properties": { // When the Object composer is indexed by string, we write it like a JSON object for performance
        "name": "Write initial definitions of JSON-TS",
        "done": false,
        "users": [
            {"properties": {"name": "Haoji Xu"}, "type": uid("_:schema/user")}
        ]
    }
}

type EntityDgraphAbstract = any; // TODO

let todoItemAbstract: EntityDgraphAbstract = {
    "uid": "0x01",
    "dgraph.type": "Entity",
    "type": uid("_:schema/todo"),
    "properties": [
        {
            "key": "name",
            "value": "Write initial definitions of JSON-TS"
        },
        {
            "key": "done",
            "value": false
        },
        {
            "key": "users",
            "value": [
                {"properties": {"name": "Haoji Xu"}, "type": uid("_:schema/user")}
            ]
        }
    ]
}