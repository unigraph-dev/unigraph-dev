const { uid, rankOnly } = context.params;
const fetch = require('node-fetch');

const pineconeKey = unigraph.getSecret('pinecone', 'api_key');
const response = await fetch(
    `${unigraph.getSecret('pinecone', 'endpoint_url')}/vectors/fetch?namespace=search&ids=${uid}`,
    {
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': pineconeKey,
        },
    },
);
const data = await response.json();
const pineconeData = {
    queries: [{ values: Object.values(data.vectors)[0].values }],
    topK: 125,
    includeMetadata: false,
    includeValues: false,
    namespace: 'search',
    filter: {
        domainTag: true,
    },
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
console.log(data3.results[0].matches);
const mostRelevantTag = data3.results[0].matches[0].id;

// add tag
if (mostRelevantTag !== uid && !rankOnly) {
    await unigraph.updateObject(
        uid,
        {
            children: [
                {
                    type: {
                        'unigraph.id': '$/schema/interface/semantic',
                    },
                    _value: {
                        uid: mostRelevantTag,
                    },
                },
            ],
        },
        undefined,
        undefined,
        [],
        [{ uid }],
    );
    console.log(`[Semantic Index] Added tag for object ${uid}`);
} else if (rankOnly) {
    return data3.results[0].matches;
}
