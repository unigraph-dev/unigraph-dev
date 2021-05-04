import { PackageDeclaration } from "../types/packages";
import { UnigraphExecutable } from "../types/unigraph";
import { makeUnigraphId } from "../utils/entityUtils";

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "Unigraph CoreUser",
        package_name: "unigraph.coreuser",
        version: "0.0.1",
        description: "Provides core utilities for enhancing the user experience."
    },
    pkgSchemas: {
        notification: {
            "dgraph.type": "Type",
            "_hide": true,
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
                        "_key": "from",
                        "_definition": {
                            "type": makeUnigraphId("$/primitive/string")
                        }
                    },
                    {
                        "_key": "content",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/interface/textual")
                        }
                    },
                    {
                        "_key": "actions",
                        "_definition": {
                            "type": makeUnigraphId("$/composer/Array"),
                            "_parameters": {
                                "_element": {
                                    "type": makeUnigraphId("$/schema/executable")
                                }
                            }
                        }
                    },
                ]
            }
        }
    },
    pkgEntities: {
        notification_center: {
            type: { "unigraph.id": "$/schema/list" },
            name: "Notification Center",
            children: []
        }
    }
}