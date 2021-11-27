const url = context.params.url;
const tags = context.params.tags ? context.params.tags : [];
const ctx = context.params.context;
const scrape = require('html-metadata');

let res;

try {
    res = await scrape({url, headers: {'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'}});
} catch (e) {
    res = await scrape({url, headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'}})
}

const result = {
    name: res?.general?.title || res?.openGraph?.title || res?.twitter?.title,
    url: url,
    favicon: res?.general?.icons?.pop().href || res?.general?.icons?.[0]?.href || res?.openGraph?.image?.url || res?.twitter?.image?.src || res?.twitter?.image,
    children: tags.map(tagName => {return {"type": {"unigraph.id": "$/schema/interface/semantic"},
        "_value": {
            "type": {"unigraph.id": "$/schema/tag"},
            name: tagName
        }}
    }),
    creative_work: {
        abstract: {
            type: {'unigraph.id': '$/schema/html'},
            _value: res?.general?.description || res?.openGraph?.description || res?.twitter?.description || ""
        }
    },
    ...(ctx ? {'$context': ctx} : {})
}

if (result.favicon?.startsWith("/")) {
    let site = new URL(url);
    result.favicon = site.origin + result.favicon;
}

const uid = await unigraph.addObject(result, "$/schema/web_bookmark");

setTimeout(() => {
    unigraph.callHook('after_bookmark_updated', {uids: [uid[0]]});
})

return uid