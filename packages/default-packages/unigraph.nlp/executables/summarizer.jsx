const { object } = params;

const type = object.type?.['unigraph.id'];

const [sum, setSum] = React.useState('');

React.useEffect(async () => {
    const text = await unigraph.runExecutable('$/executable/get-text-representation', {
        uids: object.uid,
        typeName: type,
    });
    const res = await unigraph.runExecutable('$/executable/apply-prompt-preset', {
        preset: '$/entity/prompt_preset_tldr',
        input: text,
    });
    setSum(res.result);
}, []);

return <div>{sum}</div>;
