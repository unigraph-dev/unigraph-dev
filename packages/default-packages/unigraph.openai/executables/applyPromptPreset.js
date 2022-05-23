const { preset, input } = context.params; // UIDs
const { encode, decode } = require('gpt-3-encoder');

const presetObject = await unigraph.getObject(preset);

if (!presetObject) return false;

const tokens = decode(encode(input).slice(0, 1600));
const prompt = await unigraph.runExecutable(presetObject._value.generator._value.uid, { text: tokens });
const promptResults = await unigraph.runExecutable('$/executable/lm-gpt3', {
    prompt,
    stop: presetObject._value.stop_sequence['_value.%'],
    max_tokens: presetObject._value.max_tokens['_value.#i'],
});
const text = promptResults[0]?.text;
const processed = await unigraph.runExecutable(presetObject._value.processor._value.uid, { result: text });
return processed;
