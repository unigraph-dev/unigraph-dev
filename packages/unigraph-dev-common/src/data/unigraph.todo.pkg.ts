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
            "_definition": {
                "type": makeUnigraphId("$/composer/Object"),
                "_parameters": {
                    "_indexedBy": makeUnigraphId("$/primitive/string"),
                    "_indexes": ["name"]
                },
                "_properties": [
                    {
                        "_key": "name",
                        "_definition": {
                            "type": makeUnigraphId("$/primitive/string")
                        }
                    },
                    {
                        "_key": "done",
                        "_definition": {
                            "type": makeUnigraphId("$/primitive/boolean")
                        }
                    },
                    {
                        "_key": "priority",
                        "_definition": {
                            "type": makeUnigraphId("$/primitive/number")
                        }
                    },
                    {
                        "_key": "semantic_properties",
                        "_propertyType": "inheritance",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/semantic_properties"),
                        }
                    }
                ]
            }
        }
    }
}