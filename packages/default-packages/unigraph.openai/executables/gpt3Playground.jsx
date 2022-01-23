const [promptStr, setPromptStr] = React.useState('');
const [res, setRes] = React.useState('Press button to complete with GPT-3');

return (
    <div style={{ height: '100%' }}>
        <div style={{ height: '33%' }}>
            <TextField
                variant="outlined"
                label="Prompt"
                value={promptStr}
                onChange={(ev) => setPromptStr(ev.target.value)}
                multiline
                style={{ height: '100%', width: '100%' }}
            />
        </div>
        <Divider />
        <div style={{ height: '66%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icons.Sync
                style={{ position: 'absolute', bottom: '8px', left: '8px' }}
                onClick={async () => {
                    const res = await window.unigraph.runExecutable('$/executable/lm-gpt3', {
                        prompt: promptStr,
                    });
                    setRes(res[0]?.text || 'No result');
                }}
            />
            <Card style={{ height: '80%', width: '80%' }}>
                <Typography
                    variant="body1"
                    dangerouslySetInnerHTML={{
                        __html: `<strong>${promptStr.replace(/\n/g, '<br/>')}</strong>${res.replace(/\n/g, '<br/>')}`,
                    }}
                />
            </Card>
        </div>
    </div>
);
