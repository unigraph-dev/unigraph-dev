import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const schemaIconURL = {
    ...makeUnigraphId('$/schema/icon_url'),
    "dgraph.type": "Type",
    "definition": {
        "type": makeUnigraphId('$/primitive/string')
    }
}

export const schemaURL = {
    ...makeUnigraphId('$/schema/url'),
    "dgraph.type": "Type",
    "definition": {
        "type": makeUnigraphId('$/primitive/string')
    }
}

export const schemaWebBookmark = {
    ...makeUnigraphId("$/schema/web_bookmark"),
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
                "key": "url",
                "definition": {
                    "type": makeRefUnigraphId("$/schema/url")
                }
            },
            {
                "key": "favicon",
                "definition": {
                    "type": makeRefUnigraphId("$/schema/icon_url")
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