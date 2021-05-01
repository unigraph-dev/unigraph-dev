import { PackageDeclaration } from "../types/packages";
import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "Todo",
        package_name: "unigraph.todo",
        version: "0.0.1",
        description: "Todo lists and task management."
    },
    pkgSchemas: {
        todo: {
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
                        "key": "done",
                        "definition": {
                            "type": makeUnigraphId("$/primitive/boolean")
                        }
                    },
                    {
                        "key": "priority",
                        "definition": {
                            "type": makeUnigraphId("$/primitive/number")
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