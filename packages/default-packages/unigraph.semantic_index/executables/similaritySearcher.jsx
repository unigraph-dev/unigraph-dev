const [search, setSearch] = React.useState('');
const [res, setRes] = React.useState(undefined);

return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex' }}>
            <TextField
                variant="outlined"
                label="Prompt"
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                onKeyDown={async (e) => {
                    if (e.keyCode == 13) {
                        const res = await window.unigraph.runExecutable('$/executable/do-semantic-search', {
                            similarity: search,
                        });
                        setRes(res);
                    }
                }}
                style={{ height: '100%', width: '100%' }}
            />
            <Button
                onClick={async () => {
                    const res = await window.unigraph.runExecutable('$/executable/do-semantic-search', {
                        similarity: search,
                    });
                    setRes(res);
                }}
            >
                Search
            </Button>
        </div>
        <Divider />
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
            <Card style={{ height: '90%', width: '90%', overflow: 'auto' }}>
                <DynamicObjectListView
                    items={(res || []).map((el) => ({ uid: el, _stub: true, type: { 'unigraph.id': '$/schema/any' } }))}
                    defaultFilter={[]}
                />
            </Card>
        </div>
    </div>
);
