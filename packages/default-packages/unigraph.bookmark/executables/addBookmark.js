const url = new URL(context.params.url);
const tags = context.params.tags ? context.params.tags : [];
const fetch = require('node-fetch');

const res = await fetch(url);
const text = await res.text();

//const match = text.match(/(<head>.*<\/head>)/gms);
//const head = match ? match[0] : "";
const { JSDOM } = require("jsdom");
let parsed = new JSDOM(text, { includeNodeLocations: true });
let headDom = parsed.window.document

var favicon = url.origin + "/favicon.ico";
headDom.head.childNodes.forEach((node) => {
    if (node.nodeName === "LINK" && node?.name?.includes('icon') && node.href) {
        let newUrl = new URL(node.href, url.origin)
        favicon = newUrl.href;
    }
})
//console.log(headDom)
const result = {
    name: headDom.title || url.href,
    url: url.href,
    favicon: favicon,
    semantic_properties: {
        children: tags.map(tagName => {return {name: tagName}}),
    }
}
//console.log(result)

unigraph.addObject(result, "$/schema/web_bookmark")