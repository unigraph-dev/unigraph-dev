const { url } = context.params;
const tags = context.params.tags ? context.params.tags : [];
const ctx = context.params.context;
const scrape = require('html-metadata');

const handlers = (
    await unigraph.getQueries([
        `(func: uid(parType)) @normalize @cascade {
    uid
  _value {
        match_domain {
            _value {
                md: <_value.%>
    }
  }
  handler {
            <_value> {
                huid: uid
      }
       }
}
}
var(func: eq(<unigraph.id>, "$/schema/bookmark_handler")) {
            <~type> { parType as uid }
        }`,
    ])
)[0];

const good = handlers.filter((el) => new RegExp(el.md).exec(url) != null);
if (good.length !== 0) return [await unigraph.runExecutable(good[0].huid, { url })];

let res;

const tryScrape = () =>
    new Promise(async (resolve, reject) => {
        setTimeout(() => {
            reject();
        }, 10000); // Timeout after 10 seconds
        try {
            res = await scrape({
                url,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            });
        } catch (e) {
            try {
                res = await scrape({
                    url,
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
                    },
                });
            } catch (e) {
                reject();
            }
        }
        resolve(res);
    });

try {
    res = await tryScrape();
} catch (e) {
    // Timeout or not being able to resolve, should just return.
    return [undefined];
}

const result = {
    name: res?.general?.title || res?.openGraph?.title || res?.twitter?.title,
    url,
    favicon:
        res?.general?.icons?.pop().href ||
        res?.general?.icons?.[0]?.href ||
        res?.openGraph?.image?.url ||
        res?.twitter?.image?.src ||
        res?.twitter?.image,
    children: tags.map((tagName) => {
        return {
            type: { 'unigraph.id': '$/schema/interface/semantic' },
            _value: {
                type: { 'unigraph.id': '$/schema/tag' },
                name: tagName,
            },
        };
    }),
    creative_work: {
        abstract: {
            type: { 'unigraph.id': '$/schema/html' },
            _value: res?.general?.description || res?.openGraph?.description || res?.twitter?.description || '',
        },
    },
    ...(ctx ? { $context: ctx } : {}),
};

if (result.favicon?.startsWith('/')) {
    const site = new URL(url);
    result.favicon = site.origin + result.favicon;
}

const uid = await unigraph.addObject(result, '$/schema/web_bookmark');

setTimeout(() => {
    unigraph.callHook('after_bookmark_updated', { uids: [uid[0]] });
});

return uid;
