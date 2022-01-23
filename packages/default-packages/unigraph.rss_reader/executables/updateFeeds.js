const getQuery = (targetUrl, index) => `(func: uid(parType)) @cascade { 
    uid
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
  }`;

const queries = [];

const feeds = (await unigraph.getType('$/schema/rss_feed')).map((el) => unpad(el));
const urls = feeds.map((el) => el.feed_url);
const latests = [];
const Parser = require('rss-parser');

const parser = new Parser({ timeout: 10000 });

const totalItems = await Promise.all(
    urls.map(
        (el, index) =>
            new Promise((resolve, reject) => {
                const rresolve = (its) => {
                    console.log(`RSS Feed #${index} loaded.`);
                    resolve(its);
                };
                parser
                    .parseURL(el)
                    .then((res) => rresolve(res.items))
                    .catch((e) => {
                        parser
                            .parseURL(el)
                            .then((res) => rresolve(res.items))
                            .catch((e) => {
                                parser
                                    .parseURL(el)
                                    .then((res) => rresolve(res.items))
                                    .catch((e) => rresolve([]));
                            });
                    });
            }),
    ),
);
totalItems.forEach((items, i) => {
    items.forEach((item, index) => {
        if (
            !items[0].isoDate ||
            new Date(feeds[i].last_updated || 0).getTime() < new Date(items[0].isoDate).getTime()
        ) {
            queries.push({ query: getQuery(item.link, `${i}_${index}`), item, feedId: i });
        }
    });
    latests[i] = new Date(Math.max(...items.map((el) => new Date(el.isoDate).getTime() || 0))).toISOString();
});

console.log('All items loaded!');
const results = await unigraph.getQueries(
    queries.map((el) => el.query),
    undefined,
    50,
    `var(func: eq(unigraph.id, "$/schema/rss_item")) {
    <unigraph.origin> {
      parType as uid
    }
  }`,
);
console.log('Got current entities!');
// console.log(results)
const objects = results
    .map((els, index) =>
        els.length >= 1
            ? undefined
            : {
                  feed: { uid: feeds[queries[index].feedId].uid },
                  content: {
                      text: {
                          type: { 'unigraph.id': '$/schema/html' },
                          _value: queries[index].item.content || '<br/>',
                      },
                      abstract: {
                          type: { 'unigraph.id': '$/schema/note' },
                          _value:
                              queries[index].item.contentSnippet?.slice(0, 100) ||
                              queries[index].item.content?.slice(0, 100) ||
                              'No preview available',
                      },
                  },
                  item_data: {
                      name: queries[index].item.title,
                      url: queries[index].item.link,
                      favicon: feeds[queries[index].feedId].site_info.favicon,
                      creative_work: {
                          text: {
                              type: { 'unigraph.id': '$/schema/html' },
                              _value: queries[index].item.content || '<br/>',
                          },
                          abstract: {
                              type: { 'unigraph.id': '$/schema/note' },
                              _value:
                                  queries[index].item.contentSnippet?.slice(0, 100) ||
                                  queries[index].item.content?.slice(0, 100) ||
                                  'No preview available',
                          },
                      },
                      date_created: queries[index].item.isoDate,
                  },
              },
    )
    .filter((el) => el !== undefined);
const uids = await unigraph.addObject(objects, '$/schema/rss_item');
const bookmarks = (
    await unigraph.getQueries(uids.map((el) => `(func: uid(${el})) {_value {item_data {_value {uid}}}}`))
)
    .map((el) => el[0]?._value.item_data._value.uid)
    .filter((el) => el !== undefined);

await Promise.all(
    latests.map((el, idx) =>
        unigraph.updateObject(feeds[idx].uid, {
            last_updated: el,
        }),
    ),
);

if (uids.length)
    unigraph.runExecutable('$/package/unigraph.core/0.0.1/executable/add-item-to-list', {
        where: '$/entity/inbox',
        item: uids.reverse(),
    });
// TODO: fix this race condition by enforcing
setTimeout(
    () =>
        unigraph.addNotification({
            name: 'Feeds updated',
            from: 'unigraph.rss_reader',
            content: `Added ${objects.length} items.`,
            actions: [],
        }),
    1000,
);
setTimeout(() => unigraph.callHook('after_bookmark_updated', { uids: bookmarks }), 2000);
