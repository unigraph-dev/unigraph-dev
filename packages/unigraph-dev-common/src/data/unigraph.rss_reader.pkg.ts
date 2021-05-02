import { PackageDeclaration } from "../types/packages";
import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "Executables",
        package_name: "unigraph.execexample",
        version: "0.0.1",
        description: "Example executables"
    },
    pkgSchemas: {
        rss_feed: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId("$/composer/Object"),
                "_parameters": {
                    "_indexedBy": makeUnigraphId("$/primitive/string"),
                    "_indexes": ["name"]
                },
                "_properties": [
                    {
                        "_key": "feed_url",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/url")
                        }
                    },
                    {
                        "_key": "site_info",
                        "_propertyType": "inheritance",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/web_bookmark")
                        }
                    }
                ]
            }
        },
        rss_item: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId("$/composer/Object"),
                "_parameters": {
                    "_indexedBy": makeUnigraphId("$/primitive/string"),
                    "_indexes": ["name"]
                },
                "_properties": [
                    {
                        "_key": "feed",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/rss_feed")
                        }
                    },
                    {
                        "_key": "content",
                        "_propertyType": "inheritance",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/creative_work")
                        }
                    },
                    {
                        "_key": "item_data",
                        "_propertyType": "inheritance",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/web_bookmark")
                        }
                    },
                    {
                        "_key": "semantic_properties",
                        "_propertyType": "inheritance",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/semantic_properties")
                        }
                    }
                ]
            }
        }
    },
    pkgExecutables: {
        "update-feeds": {
            env: "routine/js",
            src: "console.log(new Date())",
            periodic: "*/30 * * * *",
            editable: true,
            name: "Update feeds every half an hour"
        }
    }
}