import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"


export const schemaColor = {
    ...makeUnigraphId('$/schema/color'),
    "dgraph.type": "Type",
    "definition": {
        "type": makeUnigraphId('$/primitive/string')
    }
}

export const schemaTag = {
    ...makeUnigraphId('$/schema/tag'),
    "dgraph.type": "Type",
    "definition": {
        "type": makeUnigraphId('$/composer/Object'),
        "parameters": {
            "indexedBy": makeRefUnigraphId("$/primitive/string"),
            "indexes": ["name"]
        },
        "properties": [
            {
                "key": "name",
                "definition": {
                    "type": makeRefUnigraphId("$/primitive/string")
                },
                "unique": true
            },
            {
                "key": "color",
                "definition": {
                    "type": makeRefUnigraphId("$/schema/color")
                }
            },
        ]
    }
}

export const schemaNote = {
    ...makeUnigraphId('$/schema/note'),
    "dgraph.type": "Type",
    "definition": {
        "type": makeUnigraphId('$/primitive/string')
    }
}

export const schemaSemanticProperties = {
    ...makeUnigraphId('$/schema/semantic_properties'),
    "dgraph.type": "Type",
    "definition": {
        "type": makeUnigraphId('$/composer/Object'),
        "parameters": {
            "indexedBy": makeRefUnigraphId("$/primitive/string"),
            "indexes": ["name"]
        },
        "properties": [
            {
                "key": "tags",
                "definition": {
                    "type": makeRefUnigraphId("$/composer/Array"),
                    "parameters": {
                        "element": {"type": makeRefUnigraphId("$/schema/tag")}
                    }
                }
            },
            {
                "key": "notes",
                "definition": {
                    "type": makeRefUnigraphId("$/composer/Array"),
                    "parameters": {
                        "element": {"type": makeRefUnigraphId("$/schema/note")}
                    }
                }
            }
        ]
    }
}

export const schemaTodo = {
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
                "key": "priority",
                "definition": {
                    "type": makeRefUnigraphId("$/primitive/number")
                }
            },
            {
                "key": "semantic_properties",
                "definition": {
                    "type": makeRefUnigraphId("$/schema/semantic_properties"),
                }
            }
        ]
    }
}

type ATodoList = {
    uid?: string,
    name: string,
    done: boolean,
    priority: number,
    semantic_properties: {
        tags: [{uid?: string, color: string, name: string}] 
    }
}