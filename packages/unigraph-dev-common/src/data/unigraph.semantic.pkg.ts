import { PackageDeclaration } from "../types/packages";
import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const pkg: PackageDeclaration = {
    pkgManifest: {
        pkgDisplayName: "Semantic",
        pkgPackageName: "unigraph.semantic",
        pkgVersion: "0.0.1",
        pkgDescription: "Semantic properties support for unigraph objects."
    },
    pkgSchemas: {
        color: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        tag: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/composer/Object'),
                "parameters": {
                    "indexedBy": makeUnigraphId("$/primitive/string"),
                    "indexes": ["name"]
                },
                "properties": [
                    {
                        "key": "name",
                        "definition": {
                            "type": makeUnigraphId("$/primitive/string")
                        },
                        "unique": true
                    },
                    {
                        "key": "color",
                        "definition": {
                            "type": makeUnigraphId("$/schema/color")
                        }
                    },
                ]
            }
        },
        note: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        semantic_properties: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/composer/Object'),
                "parameters": {
                    "indexedBy": makeUnigraphId("$/primitive/string"),
                    "indexes": ["name"]
                },
                "properties": [
                    {
                        "key": "tags",
                        "definition": {
                            "type": makeUnigraphId("$/composer/Array"),
                            "parameters": {
                                "element": {"type": makeUnigraphId("$/schema/tag")}
                            }
                        }
                    },
                    {
                        "key": "notes",
                        "definition": {
                            "type": makeUnigraphId("$/composer/Array"),
                            "parameters": {
                                "element": {"type": makeUnigraphId("$/schema/note")}
                            }
                        }
                    }
                ]
            }
        }
    }
}