import { PackageDeclaration } from "../types/packages";
import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "Bookmark",
        package_name: "unigraph.bookmark",
        version: "0.0.1",
        description: "Bookmark manager."
    },
    pkgSchemas: {
        icon_url: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        url: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        web_bookmark: {
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
                        "_key": "url",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/url")
                        }
                    },
                    {
                        "_key": "favicon",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/icon_url")
                        }
                    },
                    {
                        "_key": "semantic_properties",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/semantic_properties"),
                        }
                    },
                    {
                        "_key": "source",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/interface/textual")
                        }
                    },
                    {
                        "_key": "creative_work",
                        "_propertyType": "inheritance",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/creative_work")
                        }
                    },
                ]
            }
        }

    }
}