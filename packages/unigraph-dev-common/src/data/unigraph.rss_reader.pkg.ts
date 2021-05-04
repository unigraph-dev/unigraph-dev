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

const updateFeedsCode = `const getQuery = (targetUrl) => \`(func: type(Entity)) @cascade { 
    uid
	type @filter(eq(<unigraph.id>, "$/schema/rss_item"))
    _value {
      item_data {
        _value {
          _value {
            url @filter(eq(<_value.%>, "\${targetUrl}"))
          }
        }
      }
    }
}\`

const queries = []


const feeds = (await unigraph.getType("$/schema/rss_feed")).map(el => unpad(el));
const urls = feeds.map(el => el.feed_url);
let Parser = require('rss-parser');
let parser = new Parser();
for (let i=0; i<urls.length; ++i) {
    const items = (await parser.parseURL(urls[i])).items;
    items.forEach(item => queries.push({query: getQuery(item.link), item: item, feedId: i}))
}
//console.log(queries);
const results = await unigraph.getQueries(queries.map(el => el.query));
//console.log(results)
const objects = results.map((els, index) => els.length >= 1 ? undefined : {
    feed: {uid: feeds[queries[index].feedId].uid},
    content: {
        text: queries[index].item.content,
        abstract: queries[index].item.contentSnippet,
    },
    item_data: {
        name: queries[index].item.title,
        url: queries[index].item.link,
        favicon: feeds[queries[index].feedId].site_info.favicon,
        date_created: queries[index].item.isoDate
    }
}).filter(el => el !== undefined);
for(let i=0; i<objects.length; ++i) {
    await unigraph.addObject(objects[i], "$/schema/rss_item")
}
unigraph.addNotification({name: "Feeds updated", from: "unigraph.rss_reader", content: "Added " + objects.length + " items.", actions: []})
`

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
            src: updateFeedsCode,
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