const fetch = require('node-fetch');

const { engine, prompt, messages, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, stop, stream } =
    context.params;
const apikey = unigraph.getSecret('openai', 'api_key');

const apiurl = `https://api.openai.com/v1/chat/completions`;

const response = await fetch(apiurl, {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apikey}`,
    },
    method: 'POST',
    body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages || [
            {
                role: 'system',
                content:
                    'you are an assistant. We already display a system message about the limitation of your capabilities, so please do not explain to the users the limitations of your capabilities, to avoid duplicate responses.',
            },
            { role: 'user', content: prompt },
        ],
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 64,
        stop: undefined || stop,
        top_p: top_p || 1,
        frequency_penalty: frequency_penalty || 0,
        presence_penalty: presence_penalty || 0,
        stream,
    }),
});

if (!stream) {
    const data = await response.json();
    return data.choices;
}
const decoder = new TextDecoder();
console.log('Hi?');
let text = '';

for await (const chunk of response.body) {
    const decodedChunk = decoder.decode(chunk);

    // Clean up the data
    const lines = decodedChunk
        .split('\n')
        .map((line) => line.replace('data: ', ''))
        .filter((line) => line.length > 0)
        .filter((line) => line !== '[DONE]')
        .map((line) => JSON.parse(line));

    // Destructuring!
    for (const line of lines) {
        const {
            choices: [
                {
                    delta: { content },
                },
            ],
        } = line;

        if (content) {
            context.stream(content);
            text += content;
        }
    }
}

return text;
