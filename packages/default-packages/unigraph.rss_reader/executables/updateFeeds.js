const getQuery = (targetUrl) => `(func: type(Entity)) @cascade { 
    uid
	type @filter(eq(<unigraph.id>, "$/schema/rss_item"))
    _value {
      item_data {
        _value {
          _value {
            url {
              _value @filter(eq(<_value.%>, "${targetUrl}"))
            }
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
        text: {type: {'unigraph.id': '$/schema/html'}, _value: queries[index].item.content},
        abstract: {type: {'unigraph.id': '$/schema/note'}, _value: queries[index].item.contentSnippet?.slice(0, 100) || queries[index].item.content?.slice(0, 100) || "No preview available"},
    },
    item_data: {
        name: queries[index].item.title,
        url: queries[index].item.link,
        favicon: feeds[queries[index].feedId].site_info.favicon,
        date_created: queries[index].item.isoDate
    }
}).filter(el => el !== undefined);
const uids = [];
for(let i=0; i<objects.length; ++i) {
    const uid = await unigraph.addObject(objects[i], "$/schema/rss_item");
    uids.push(uid[0])
}
if (uids.length) unigraph.runExecutable("$/package/unigraph.core/0.0.1/executable/add-item-to-list", {where: "$/entity/inbox", item: uids.reverse()});
// TODO: fix this race condition by enforcing 
setTimeout(() => unigraph.addNotification({name: "Feeds updated", from: "unigraph.rss_reader", content: "Added " + objects.length + " items.", actions: []}), 1000);
