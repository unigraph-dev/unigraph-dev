import { PackageDeclaration } from "../types/packages";
import { UnigraphExecutable } from "../types/unigraph";
import { makeUnigraphId } from "../utils/entityUtils";

/**
 * Adds an item to a unigraph list.
 * @param item: the item object to add.
 * @param schema: the schema string of that item.
 * @param target: target UID of that list. 
 */
export const addItemToList: UnigraphExecutable<{item: any, schema: string, target: string}> = (context, unigraph) => {
    // TODO: add features to add item to list.
}

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "Unigraph Core",
        package_name: "unigraph.core",
        version: "0.0.1",
        description: "The core package of Unigraph, contains many high level abstractions for development."
    },
    pkgSchemas: {
        list: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/composer/Object'),
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
                        "_key": "children",
                        "_definition": {
                            "type": makeUnigraphId('$/composer/Array'),
                            "_parameters": {
                                "_element": {
                                    "type": makeUnigraphId('$/schema/any')
                                }
                            }
                        }
                    },
                    {
                        "_key": "semantic_properties",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/semantic_properties")
                        }
                    },
                ]
            }
        }
    }
}