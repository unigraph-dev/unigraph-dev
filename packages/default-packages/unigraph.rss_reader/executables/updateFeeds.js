const getQuery = (targetUrl) => `(func: type(Entity)) @cascade { 
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
}`

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
