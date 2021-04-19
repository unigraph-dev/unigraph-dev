import { PackageDeclaration } from "../types/packages";
import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const pkg: PackageDeclaration = {
    pkgManifest: {
        pkgDisplayName: "Bookmark",
        pkgPackageName: "unigraph.bookmark",
        pkgVersion: "0.0.1",
        pkgDescription: "Bookmark manager."
    },
    pkgSchemas: {
        icon_url: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        url: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        web_bookmark: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId("$/composer/Object"),
                "parameters": {
                    "indexedBy": makeUnigraphId("$/primitive/string"),
                    "indexes": ["name"]
                },
                "properties": [
                    {
                        "key": "name",
                        "definition": {
                            "type": makeUnigraphId("$/primitive/string")
                        }
                    },
                    {
                        "key": "url",
                        "definition": {
                            "type": makeUnigraphId("$/schema/url")
                        }
                    },
                    {
                        "key": "favicon",
                        "definition": {
                            "type": makeUnigraphId("$/schema/icon_url")
                        }
                    },
                    {
                        "key": "semantic_properties",
                        "definition": {
                            "type": makeUnigraphId("$/schema/semantic_properties"),
                        }
                    }
                ]
            }
        }

    }
}