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
    const data3 = await response3.json();
    return data3.results[0].matches.map((el) => el.id);
}

const response = await fetch(
    `${unigraph.getSecret('pinecone', 'endpoint_url')}/vectors/fetch?namespace=search&ids=${similarity}`,
    {
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': pineconeKey,
        },
    },
);
const data = await response.json();
// console.log(Object.values(data.vectors)[0].values);
const pineconeData = {
    queries: [{ values: Object.values(data.vectors)[0].values }],
    topK: 25,
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
const data3 = await response3.json();
return data3.results[0].matches.map((el) => el.id);
