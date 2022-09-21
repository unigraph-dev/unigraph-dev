const { uids, typeName, objects } = context.params;

const templates = {
    '$/schema/tweet': (data) => `Tweet: ${data._value.text._value._value['_value.%']}
From: ${data._value.from_user._value._value.name['_value.%']} (${data._value.from_user._value._value.description._value._value['_value.%']})`,
    '$/schema/reddit_post': (data) => `Reddit post: ${data._value.name._value._value['_value.%']}
${data._value.selftext._value._value['_value.%']}
Subreddit: r/${data._value.subreddit._value._value.name['_value.%']}
Subreddit description: ${new UnigraphObject(data).get('subreddit/description')?.as('primitive')}`,
    '$/schema/web_bookmark': (data) => `Title: ${new UnigraphObject(data).get('name')?.as('primitive')}
Abstract: ${new UnigraphObject(data).get('creative_work/abstract')?.as('primitive')}
Content: ${new UnigraphObject(data).get('creative_work/text')?.as('primitive')}`,
    '$/schema/youtube_video': (data) => `YouTube video: ${new UnigraphObject(data).get('title')?.as('primitive')}
Description: ${new UnigraphObject(data).get('description')?.as('primitive')}
Channel: ${new UnigraphObject(data).get('channel/name')?.as('primitive')}`,
    '$/schema/email_message': (data) => {
        const { Readability } = require('@mozilla/readability');
        const { JSDOM } = require('jsdom');
        const textHtml = new UnigraphObject(data).get('content/text')?.as('primitive');
        const doc = new JSDOM(textHtml);
        const text =
            new Readability(doc.window.document).parse()?.textContent ||
            new UnigraphObject(data).get('content/abstract')?.as('primitive');
        return `Email Title: ${new UnigraphObject(data).get('name')?.as('primitive')}
${text}`;
    },
    '$/schema/rss_item': (data) => {
        const { Readability } = require('@mozilla/readability');
        const { JSDOM } = require('jsdom');
        const textHtml =
            new UnigraphObject(data).get('item_data/creative_work/text')?.as('primitive') ||
            new UnigraphObject(data).get('content/text')?.as('primitive');
        const doc = new JSDOM(textHtml);
        const text =
            new Readability(doc.window.document).parse()?.textContent ||
            new UnigraphObject(data).get('content/abstract')?.as('primitive');
        return `RSS article title: ${new UnigraphObject(data).get('item_data/name')?.as('primitive')}
Feed: ${new UnigraphObject(data).get('feed/site_info/name')?.as('primitive')}
${text}`;
    },
    '$/schema/tag': (data) =>
        `Tag: ${new UnigraphObject(data).get('name')?.as('primitive')}, description: ${new UnigraphObject(data)
            .get('description')
            ?.as('primitive')}`,
    '$/schema/todo': (data) => {
        const name = new UnigraphObject(data).get('name')?.as('primitive');
        const tags = (new UnigraphObject(data).get('children')?.['_value['] || [])
            .filter(
                (el) =>
                    el?._value?.type?.['unigraph.id'] === '$/schema/interface/semantic' &&
                    el?._value?._value?.type?.['unigraph.id'] === '$/schema/tag',
            )
            .map((el) => new UnigraphObject(el._value._value).get('name')?.as('primitive'))
            .filter((el) => el?.length)
            .map((el) => `#${el}`);
        return `Todo item: ${name}${tags.length ? `\nTags: ${tags.join(', ')}` : ``}`;
    },
};

let data = objects;

if (uids && typeName && !objects) {
    data = await unigraph.getObject(uids, { queryAsType: typeName });
}

if (!data) return;
let ret;

if (Array.isArray(data)) {
    ret = data.map((obj) => ({ uid: obj.uid, text: templates[typeName]?.(obj) || '' }));
} else ret = templates[typeName]?.(data) || '';

return ret;
