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
    '$/schema/youtube_video',
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

const res = (
    await Promise.all(
        Object.entries(typeGroups).map(([typeName, uids]) => {
            return unigraph.runExecutable('$/executable/get-text-representation', {
                uids,
                typeName,
            });
        }),
    )
).reduce((prev, curr) => [...prev, ...curr], []);

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
