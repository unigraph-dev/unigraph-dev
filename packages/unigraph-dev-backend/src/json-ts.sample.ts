import { assert } from "console";
import { SchemaDgraph, UidType, EntityDgraph, UnigraphIdType, RefUnigraphIdType } from "./json-ts";
import { buildUnigraphEntity, makeRefUnigraphId, makeUnigraphId } from "./utils/entityUtils";

let todoSchema: SchemaDgraph = {
    ...makeUnigraphId("$/schema/todo"),
    "dgraph.type": "Type",
    "definition": {
        "type": makeRefUnigraphId("$/composer/Object"),
        "parameters": {
            "indexedBy": makeRefUnigraphId("$/primitive/string"),
            "indexes": ["name"]
        },
        "properties": [
            {
                "key": "name",
                "definition": {
                    "type": makeRefUnigraphId("$/primitive/string")
                }
            },
            {
                "key": "done",
                "definition": {
                    "type": makeRefUnigraphId("$/primitive/boolean")
                }
            },
            {
                "key": "users",
                "definition": {
                    "type": makeRefUnigraphId("$/composer/Array"),
                    "parameters": {
                        "element": {"type": makeRefUnigraphId("$/schema/user")}
                    }
                }
            }
        ]
    }
}

// This is the entity before the `buildUngiraphEntity` operation, similar to most Object-Relation Mapping representations.
let todoItemRaw = {
    name: "Write initial definitions of JSON-TS",
    done: false,
    users: [
        {
            name: "Haoji Xu",
        }
    ]
}

// This is the entity after the `buildUnigraphEntity` operation.
let todoItem: EntityDgraph<"todo"> = {
    "dgraph.type": "Entity",
    "type": makeRefUnigraphId("$/schema/todo"),
    "_value": { // When the Object composer is indexed by string, we write it like a JSON object for performance
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

// The operation should successfully yield the above result.
// TODO: Find an elegant way to deal with nested objects (maybe via schema verification?) 
// Currently this assertion fails because nested objects doens't get dgraph metadata.
assert(todoItem === buildUnigraphEntity(todoItemRaw, "todo"), JSON.stringify(buildUnigraphEntity(todoItemRaw, "todo"), null, 4));

type EntityDgraphAbstract = any; // TODO

let todoItemAbstract: EntityDgraphAbstract = {
    "uid": "0x01",
    "dgraph.type": "Entity",
    "type": makeRefUnigraphId("$/schema/todo"),
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
                {
                    "_value": {"name": "Haoji Xu"}, 
                    "dgraph.type": "Entity", 
                    "type": makeRefUnigraphId("$/schema/user")
                }
            ]
        }
    ]
}

