// run the thing
const fetch = require('node-fetch');

const { search, similarity } = context.params;
const pineconeKey = unigraph.getSecret('pinecone', 'api_key');

if (search) {
    const apiurl = `https://api.openai.com/v1/engines/text-search-curie-query-001/embeddings`;
    const apikey = unigraph.getSecret('openai', 'api_key');
    const response = await fetch(apiurl, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
        },
        method: 'POST',
        body: JSON.stringify({
            input: search,
        }),
    });
    const data = await response.json();
    // return data.data[0];
    const pineconeData = {
        queries: [{ values: data.data[0].embedding }],
        topK: 25,
        includeMetadata: true,
        includeValues: false,
        namespace: 'search',
    };
    const response3 = await fetch(`${unigraph.getSecret('pinecone', 'endpoint_url')}/query`, {
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': pineconeKey,
        },
        method: 'POST',
        body: JSON.stringify(pineconeData),
    });
    const data3 = await response3.json();
    // console.log(data3.results[0].matches);
    return data3.results[0].matches;
}

const pineconeData = {
    id: similarity,
    topK: 75,
    includeMetadata: false,
    includeValues: false,
    namespace: 'search',
};
const response3 = await fetch(`${unigraph.getSecret('pinecone', 'endpoint_url')}/query`, {
    headers: {
        'Content-Type': 'application/json',
        'Api-Key': pineconeKey,
    },
    method: 'POST',
    body: JSON.stringify(pineconeData),
});

console.log('bruh123');

// console.log('bruh');
const data3 = await response3.json();
// console.log(data3);
/*
const types = data3.matches.map(el => el?.metadata?.type).filter(Boolean);
const typesMap = {};
types.forEach(el => {typesMap[el] = []});

//console.log(types);

const v = require('vectorious');

//console.log('yoyo');
await Promise.all(
    Object.keys(typesMap).map(async (typeName) => {
        const typeResp = await (await fetch(`${unigraph.getSecret('pinecone', 'endpoint_url')}/query`, {
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': pineconeKey,
            },
            method: 'POST',
            body: JSON.stringify({
                id: similarity,
                topK: 5,
                includeMetadata: false,
                includeValues: true,
                namespace: 'search',
                filter: {
                    "type": {"$eq": typeName}
                }
            }),
        })).json();
        const its = typeResp.matches.map(el => el.values);
        let sum = v.zeros(its[0].length);
        its.forEach((el) => {sum = v.add(sum, new v.NDArray(el))});
        const avg = v.scale(sum, -1 * (1 / its.length) * 0.5);
        typesMap[typeName] = avg;
    })
)
//console.log('done');

const self = v.add(new v.NDArray(data3.matches[0].values), typesMap[data3.matches[0]?.metadata?.type] || v.zeros(data3.matches[0].values.length));
const res = data3.matches.map(el => ({
    id: el.id,
    type: el?.metadata?.type,
    score: v.dot(self, v.add(el.values, typesMap[el?.metadata?.type] || typesMap[data3.matches[0]?.metadata?.type]))
})).sort((a, b) => b.score - a.score);
//console.log(res);

return res;
*/

return data3.matches;
