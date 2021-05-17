const url = context.params.url;
const tags = context.params.tags ? context.params.tags : [];
const scrape = require('html-metadata');

const res = await scrape(url);

const result = {
    name: res?.general?.title || res?.openGraph?.title || res?.twitter?.title,
    url: url,
    favicon: res?.general?.icons?.pop().href || res?.general?.icons[0]?.href || res?.openGraph?.image?.url || res?.twitter?.image?.src || res?.twitter?.image,
    semantic_properties: {
        children: tags.map(tagName => {return {name: tagName}}),
    },
    creative_work: {
        abstract: res?.general?.description || res?.openGraph?.description || res?.twitter?.description
    }
}

if (result.favicon?.startsWith("/")) {
    let site = new URL(url);
    result.favicon = site.origin + result.favicon;
}

unigraph.addObject(result, "$/schema/web_bookmark")