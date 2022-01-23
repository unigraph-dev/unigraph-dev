const { opmlText } = context.params;
const { JSDOM } = require('jsdom');

const opmlDom = new JSDOM(opmlText, { contentType: 'text/xml' });
const feeds = Array.from(opmlDom.window.document.querySelectorAll('outline[type="rss"]'));
const feedObjs = feeds.map((el) => ({
    feed_url: el.getAttribute('xmlUrl'),
    site_info: {
        name: el.getAttribute('text'),
        url: el.getAttribute('htmlUrl'),
        favicon: `${el.getAttribute('htmlUrl')}/favicon.ico`,
        creative_work: {
            abstract: {
                type: { 'unigraph.id': '$/schema/html' },
                _value: el.getAttribute('description').length ? el.getAttribute('description') : undefined,
            },
        },
    },
}));
// console.log(JSON.stringify(feedObjs, null, 4));
for (let i = 0; i < feedObjs.length; ++i) {
    const Parser = require('rss-parser');
    const parser = new Parser();
    const feed = await parser.parseURL(feedObjs[i].feed_url).catch((e) => {
        console.log('error...');
    });
    if (feed) {
        await unigraph.addObject(feedObjs[i], '$/schema/rss_feed');
        console.log(`added feed #${i}`);
    }
}
