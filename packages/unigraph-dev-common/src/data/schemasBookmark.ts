import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const schemaIconURL = {
    ...makeUnigraphId('$/schema/icon_url'),
    "dgraph.type": "Type",
    "_definition": {
        "type": makeUnigraphId('$/primitive/string')
    }
}

export const schemaURL = {
    ...makeUnigraphId('$/schema/url'),
    "dgraph.type": "Type",
    "_definition": {
        "type": makeUnigraphId('$/primitive/string')
    }
}

export const schemaWebBookmark = {
    ...makeUnigraphId("$/schema/web_bookmark"),
    "dgraph.type": "Type",
    "_definition": {
        "type": makeRefUnigraphId("$/composer/Object"),
        "parameters": {
            "indexedBy": makeRefUnigraphId("$/primitive/string"),
            "indexes": ["name"]
        },
        "properties": [
            {
                "_key": "name",
                "_definition": {
                    "type": makeRefUnigraphId("$/primitive/string")
                }
            },
            {
                "_key": "url",
                "_definition": {
                    "type": makeRefUnigraphId("$/schema/url")
                }
            },
            {
                "_key": "favicon",
                "_definition": {
                    "type": makeRefUnigraphId("$/schema/icon_url")
                }
            },
            {
                "_key": "semantic_properties",
                "_definition": {
                    "type": makeRefUnigraphId("$/schema/semantic_properties"),
                }
            }
        ]
    }
}