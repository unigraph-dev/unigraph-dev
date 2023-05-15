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
        console.log(res);
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
        <div className="mt-2 mx-3 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <HeroIcons.MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="search"
                    name="search"
                    id="text"
                    className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder={'"texts about summer travel planning"'}
                    value={search}
                    onChange={(ev) => setSearch(ev.target.value)}
                    onKeyDown={async (e) => {
                        if (e.keyCode == 13) {
                            setIsSearching(true);
                            const res = await window.unigraph.runExecutable('$/executable/do-semantic-search', {
                                search,
                            });
                            console.log({ res });
                            setRes(res);
                            setIsSearching(false);
                        }
                    }}
                />
            </div>
            <button
                type="button"
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={async () => {
                    setIsSearching(true);
                    const res = await window.unigraph.runExecutable('$/executable/do-semantic-search', {
                        search,
                    });
                    setRes(res);
                    setIsSearching(false);
                }}
            >
                Search
            </button>
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
        <DynamicObjectListView items={toDisplay} defaultFilter={[]} />
    </div>
);
