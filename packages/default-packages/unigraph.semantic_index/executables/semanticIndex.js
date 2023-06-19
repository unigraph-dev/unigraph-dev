const its = (
    await unigraph.getQueries([
        `(func: uid(${context.params.uids.join(', ')})) @filter(has(type) AND NOT eq(<_propertyType>, "inheritance")) {
    uid
    _hide
    _embedding
    _updatedAt
    <type> { <unigraph.id> }
}`,
    ])
)[0];

const fetch = require('node-fetch');

const includedTypes = [
    '$/schema/email_message',
    '$/schema/web_bookmark',
    '$/schema/tweet',
    '$/schema/reddit_post',
    '$/schema/rss_item',
    '$/schema/tag',
    '$/schema/youtube_video',
    '$/schema/todo',
    '$/schema/text_message',
    '$/schema/note_block',
    '$/schema/executable',
];

// these will be added later
const expandedTypes = ['$/schema/contact', '$/schema/calendar_event'];

// FIXME: naive, time-dependent thingy
const getEmbeddingUpdatedAt = (str) => (str?.startsWith('20') ? new Date(str).getTime() : 0);
const getUpdatedAt = (str) => new Date(str).getTime();

const eligibles = its.filter(
    (el) =>
        includedTypes.includes(el.type?.['unigraph.id']) &&
        getUpdatedAt(el._updatedAt) > getEmbeddingUpdatedAt(el._embedding),
);

if (!eligibles.length) return;

const { encode, decode } = require('gpt-3-encoder');
const { ChromaClient, OpenAIEmbeddingFunction } = require('chromadb');

const apikey = unigraph.getSecret('openai', 'api_key');

const chromaClient = new ChromaClient();
const embedder = new OpenAIEmbeddingFunction(apikey);
const collection = await chromaClient.getOrCreateCollection('unigraph', {}, embedder);

const typeGroups = eligibles.reduce((prev, curr) => {
    const currType = curr.type?.['unigraph.id'];
    if (prev[currType]) prev[currType].push(curr.uid);
    else prev[currType] = [curr.uid];
    return prev;
}, {});

const res = (
    await Promise.all(
        Object.entries(typeGroups).map(async ([typeName, uids]) => {
            const its = await unigraph.runExecutable('$/executable/get-text-representation', {
                uids,
                typeName,
            });
            return its.map((el) => ({ ...el, type: typeName }));
        }),
    )
).reduce((prev, curr) => [...prev, ...curr], []);

if (res.length) {
    // console.log(res);
    const tokens = res.map((el) => decode(encode(el.text).slice(0, 8100)));

    // await Promise.all(res.map((el, idx) => collection.upsert(
    //     el.uid,
    //     undefined,
    //     { type: el.type },
    //     tokens[idx],
    // )));

    const embs = await embedder.generate(tokens);
    const ress = await fetch(`http://localhost:8000/api/v1/collections/unigraph/upsert`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ids: res.map((el) => el.uid),
            documents: tokens,
            metadatas: res.map((el) => ({ type: el.type })),
            embeddings: embs,
        }),
    });

    if (!ress.ok) {
        throw new Error(`HTTP status ${ress.status}`);
    }

    console.log(`[Semantic Index] Successfully added ${res.length} items to Chroma.`);

    const nowTimeString = new Date().toISOString();

    const triplets = res.flatMap((el) => [
        `<${el.uid}> <_embedding> "${its.find((it) => el.uid === it.uid)._updatedAt}" .`,
        `<${el.uid}> <_updatedAt> "${its.find((it) => el.uid === it.uid)._updatedAt}" .`,
    ]);
    console.log(tokens, triplets);
    await unigraph.updateTriplets(triplets, undefined, []);
}
