import { SchemaDgraph, UidType, EntityDgraph, UnigraphIdType, RefUnigraphIdType } from "./json-ts";

function uid<idType extends string>(id: idType): UidType<idType> {return {"uid": id}}
function makeUnigraphId<idType extends string>(id: idType): UnigraphIdType<idType> {return {"unigraph.id": id}}
function makeRefUnigraphId<idType extends string>(id: idType): RefUnigraphIdType<idType> {return {"$ref":{"unigraph.id": id}}}

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

let todoItem: EntityDgraph<"todo"> = {
    "uid": "0x01",
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

