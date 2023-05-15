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
    '$/schema/todo',
];

// these will be added later
const expandedTypes = ['$/schema/contact', '$/schema/calendar_event', '$/schema/note_block'];

const eligibles = its.filter((el) => el._hide !== true && includedTypes.includes(el.type?.['unigraph.id']));

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

    await collection.add(
        res.map((el) => el.uid), // UID's
        undefined, // embeddings,
        res.map((el) => ({
            type: el.type,
        })),
        tokens,
    );

    console.log(`[Semantic Index] Successfully added ${res.length} items to Chroma.`);

    const triplets = res.map((el) => `<${el.uid}> <_embedding> "chromadb" .`);
    await unigraph.updateTriplets(triplets, undefined, []);
}
