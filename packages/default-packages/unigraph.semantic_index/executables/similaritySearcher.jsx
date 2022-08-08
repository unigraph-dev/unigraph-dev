const [search, setSearch] = React.useState('');
const [isSearching, setIsSearching] = React.useState(false);
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
                        setIsSearching(true);
                        const res = await window.unigraph.runExecutable('$/executable/do-semantic-search', {
                            similarity: search,
                        });
                        setRes(res);
                        setIsSearching(false);
                    }
                }}
                style={{ height: '100%', width: '100%' }}
            />
            <Button
                onClick={async () => {
                    setIsSearching(true);
                    const res = await window.unigraph.runExecutable('$/executable/do-semantic-search', {
                        similarity: search,
                    });
                    setRes(res);
                    setIsSearching(false);
                }}
            >
                Search
            </Button>
        </div>
        {isSearching ? (
            <div className="meter-progress">
                <span style={{ width: '100%', height: '100%', display: 'block' }}>
                    <span className="progress-1s" style={{ backgroundColor: '#707070' }} />
                </span>
            </div>
        ) : (
            <div style={{ height: '5px', width: '100%', display: 'block' }} />
        )}
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
