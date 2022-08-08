const [originUid, setOriginUid] = React.useState(params.originUid);
const [res, setRes] = React.useState(undefined);

React.useEffect(() => {
    let state;
    let stateTracker;
    if (params.trackActiveDetailedView) {
        state = unigraph.getState('global/activeDetailedView');
        stateTracker = (newUid) => {
            if (newUid?.startsWith('0x')) {
                setOriginUid(newUid);
            }
        };
        state.subscribe(stateTracker, true);
    }
    return () => (state ? state.unsubscribe(stateTracker) : false);
}, []);

const [search, setSearch] = React.useState('');
const [isSearching, setIsSearching] = React.useState(false);
const [toDisplay, setToDisplay] = React.useState([]);

React.useEffect(async () => {
    if (originUid) {
        setIsSearching(true);
        const res = await window.unigraph.runExecutable('$/executable/do-semantic-search', {
            similarity: originUid,
        });
        setRes(res);
        setIsSearching(false);
    }
}, [originUid]);

React.useEffect(async () => {
    const results = Array.isArray(res) ? res : [];
    console.log(res);
    if (!results.length) {
        setToDisplay([]);
        return;
    }
    const hiddenStats = (
        await window.unigraph.getQueries([`(func: uid(${res.map((el) => el.id).join(', ')})) { uid _hide }`])
    )[0];
    const hiddenMap = {};
    hiddenStats.forEach((el) => (hiddenMap[el.uid] = el._hide));
    const mapped = results.map((el) => ({
        uid: el.id,
        _hide: hiddenMap[el.id],
        _stub: true,
        type: { 'unigraph.id': '$/schema/any' },
    }));
    console.log(mapped);
    setToDisplay(mapped);
}, [res]);

return (
    <div style={{ height: '100%', flexDirection: 'column', display: 'flex' }}>
        <div style={{ display: originUid || params.trackActiveDetailedView ? 'none' : 'flex' }}>
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
        {!(originUid || params.trackActiveDetailedView) ? (
            <div
                style={{
                    flexGrow: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'auto',
                }}
            >
                <Card style={{ height: '90%', width: '90%', overflow: 'auto' }}>
                    <DynamicObjectListView items={toDisplay} defaultFilter={[]} />
                </Card>
            </div>
        ) : (
            <DynamicObjectListView items={toDisplay} defaultFilter={['no-hidden']} />
        )}
    </div>
);
