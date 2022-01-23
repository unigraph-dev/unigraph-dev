const { preset, input } = context.params; // UIDs

const presetObject = await unigraph.getObject(preset);

if (!presetObject) return false;

const prompt = await unigraph.runExecutable(presetObject._value.generator._value.uid, input);
const promptResults = await unigraph.runExecutable('$/executable/lm-gpt3', {
    prompt,
    stop: presetObject._value.stop_sequence['_value.%'],
    max_tokens: presetObject._value.max_tokens['_value.#i'],
});
const text = promptResults[0]?.text;
const processed = await unigraph.runExecutable(presetObject._value.processor._value.uid, { result: text });
return processed;
