const its = (
    await unigraph.getQueries([
        `(func: uid(${context.params.uids.join(
            ', ',
        )})) @filter(has(type) AND NOT has(<_embedding>) AND NOT eq(<_propertyType>, "inheritance")) {
    uid
    _hide
    <type> { <unigraph.id> }
}`,
    ])
)[0];

const includedTypes = [
    '$/schema/email_message',
    '$/schema/web_bookmark',
    '$/schema/tweet',
    '$/schema/reddit_post',
    '$/schema/rss_item',
    '$/schema/tag',
];

// these will be added later
const expandedTypes = ['$/schema/contact', '$/schema/calendar_event', '$/schema/todo', '$/schema/note_block'];

const eligibles = its.filter((el) => el._hide !== true && includedTypes.includes(el.type?.['unigraph.id']));

if (!eligibles.length) return;

const fetch = require('node-fetch');

const apikey = unigraph.getSecret('openai', 'api_key');
const apiurl2 = `https://api.openai.com/v1/engines/text-search-curie-doc-001/embeddings`;
const endpoint = unigraph.getSecret('pinecone', 'endpoint_url');
const pineconeKey = unigraph.getSecret('pinecone', 'api_key');
const { encode, decode } = require('gpt-3-encoder');

const typeGroups = eligibles.reduce((prev, curr) => {
    const currType = curr.type?.['unigraph.id'];
    if (prev[currType]) prev[currType].push(curr.uid);
    else prev[currType] = [curr.uid];
    return prev;
}, {});

const totalResponses = (
    await Promise.all(
        Object.entries(typeGroups).map(([typeName, uids]) => {
            return unigraph.getObject(uids, { queryAsType: typeName });
        }),
    )
).reduce((prev, curr) => [...prev, ...curr], []);

const templates = {
    '$/schema/tweet': (data) => `Tweet: ${data._value.text._value._value['_value.%']}
From: ${data._value.from_user._value._value.name['_value.%']} (${data._value.from_user._value._value.description._value._value['_value.%']})`,
    '$/schema/reddit_post': (data) => `Reddit post: ${data._value.name._value._value['_value.%']}
${data._value.selftext._value._value['_value.%']}
Subreddit: r/${data._value.subreddit._value._value.name['_value.%']}
Subreddit description: ${new UnigraphObject(data).get('subreddit/description')?.as('primitive')}`,
    '$/schema/web_bookmark': (data) => `Title: ${new UnigraphObject(data).get('name')?.as('primitive')}
Abstract: ${new UnigraphObject(data).get('creative_work/abstract')?.as('primitive')}`,
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
};

const res = totalResponses.map((el) => ({ uid: el.uid, text: templates[el.type['unigraph.id']]?.(el) || '' }));

if (res.length) {
    // console.log(res);
    const tokens = res.map((el) => decode(encode(el.text).slice(0, 2000)));

    const response2 = await fetch(apiurl2, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
        },
        method: 'POST',
        body: JSON.stringify({
            input: tokens,
        }),
    });
    const data2 = await response2.json();
    if (!data2.data) throw new Error(JSON.stringify(data2));
    const pineconeData2 = data2.data.map((el) => ({ values: el.embedding, id: res[el.index].uid }));

    const response4 = await fetch(`${endpoint}/vectors/upsert`, {
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': pineconeKey,
        },
        method: 'POST',
        body: JSON.stringify({
            vectors: pineconeData2,
            namespace: 'search',
        }),
    });
    const data4 = await response4.json();

    if (data4?.upsertedCount === res.length) {
        console.log(`[Semantic Index] Successfully added ${res.length} items to pinecone endpoint at ${endpoint}`);
    }

    const triplets = res.map((el) => `<${el.uid}> <_embedding> "${endpoint}" .`);
    await unigraph.updateTriplets(triplets, undefined, []);
}
