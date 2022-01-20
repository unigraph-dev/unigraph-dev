const { Readability, isProbablyReaderable } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const controller = new AbortController();
const timeout = setTimeout(() => {
    controller.abort();
}, 10000);

console.log(`Downloading full text of url: ${context.params.url}`);
try {
    context.params.html = await (
        await fetch(context.params.url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            },
        })
    ).text();
} catch (error) {
    context.params.html = '';
} finally {
    clearTimeout(timeout);
}

const doc = new JSDOM(context.params.html, { url: context.params.url });

console.log(`Downloaded full text of url: ${context.params.url}`);

if (isProbablyReaderable(doc.window.document)) {
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    return article;
}
return undefined;
