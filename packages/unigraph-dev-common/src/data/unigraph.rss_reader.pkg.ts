import { PackageDeclaration } from "../types/packages";
import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

const addFeedCode = `const url = context.params.url;
let Parser = require('rss-parser');
let parser = new Parser();
const feed = await parser.parseURL(url);
const feedObj = {
    feed_url: url,
    site_info: {
        name: feed.title,
        url: feed.link,
        favicon: feed.link + "/favicon.ico",
        creative_work: {
            abstract: feed.description
        }
    }
}

const result = await unigraph.addObject(feedObj, '$/schema/rss_feed')
                            
console.log(result);`

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "RSS Reader",
        package_name: "unigraph.rss_reader",
        version: "0.0.1",
        description: "An RSS Reader with Unigraph"
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
        },
        "add-feed": {
            env: "routine/js",
            src: addFeedCode,
            editable: true,
            name: "Add a feed to RSS feeds list"
        }
    }
}