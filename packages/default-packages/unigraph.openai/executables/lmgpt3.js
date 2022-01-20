const fetch = require('node-fetch');

const { engine, prompt, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, stop } = context.params;
const apikey = unigraph.getSecret('openai', 'api_key');

const apiurl = `https://api.openai.com/v1/engines/${engine || 'davinci'}/completions`;

const response = await fetch(apiurl, {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apikey}`,
    },
    method: 'POST',
    body: JSON.stringify({
        prompt,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 64,
        stop: undefined || stop,
        top_p: top_p || 1,
        frequency_penalty: frequency_penalty || 0,
        presence_penalty: presence_penalty || 0,
    }),
});

const data = await response.json();
return data.choices;
