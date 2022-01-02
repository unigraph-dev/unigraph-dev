const { url } = context.params;
const Parser = require('rss-parser');

const parser = new Parser();
const feed = await parser.parseURL(url);
const feedObj = {
    feed_url: url,
    site_info: {
        name: feed.title,
        url: feed.link,
        favicon: `${feed.link}/favicon.ico`,
        creative_work: {
            abstract: {
                type: { 'unigraph.id': '$/schema/html' },
                _value: feed.description || 'No description',
            },
        },
    },
};

const result = await unigraph.addObject(feedObj, '$/schema/rss_feed');
