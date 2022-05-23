const fetch = require('node-fetch');

const resp = await fetch(`${unigraph.getSecret('pinecone', 'endpoint_url')}/describe_index_stats`, {
    headers: {
        'Api-Key': unigraph.getSecret('pinecone', 'api_key'),
    },
});
const json = await resp.json();
return json;
