import { SchemaDgraph, UidType, EntityDgraph } from "./json-ts";

function uid<idType extends string>(id: idType): UidType<idType> {return {"uid": id}}

let todoSchema: SchemaDgraph = {
    ...uid("_:schema/todo"),
    "dgraph.type": "Type",
    "definition": {
        "type": uid("_:composer/Object"),
        "parameters": {
            "indexedBy": uid("_:primitive/string"),
            "indexes": ["name"]
        },
        "properties": [
            {
                "key": "name",
                "definition": {
                    "type": uid("_:primitive/string")
                }
            },
            {
                "key": "done",
                "definition": {
                    "type": uid("_:primitive/boolean")
                }
            },
            {
                "key": "users",
                "definition": {
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
    "_value": { // When the Object composer is indexed by string, we write it like a JSON object for performance
        "name": {"_value": "Write initial definitions of JSON-TS"},
        "done": {"_value": false},
        "users": {"_value": [
            {"_value": {"name": {"_value": "Haoji Xu"}}, "type": uid("_:schema/user")}
        ]}
    }
}

type EntityDgraphAbstract = any; // TODO

let todoItemAbstract: EntityDgraphAbstract = {
    "uid": "0x01",
    "dgraph.type": "Entity",
    "type": uid("_:schema/todo"),
    "_value": [
        {
            "key": "name",
            "_value": "Write initial definitions of JSON-TS"
        },
        {
            "key": "done",
            "_value": false
        },
        {
            "key": "users",
            "_value": [
                {"_value": {"name": "Haoji Xu"}, "type": uid("_:schema/user")}
            ]
        }
    ]
}