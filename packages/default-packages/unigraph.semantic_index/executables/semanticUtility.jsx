const [status, setStatus] = React.useState(false);
const [tags, setTags] = React.useState([]);
const [uidsInput, setUidsInput] = React.useState('');
const [tuidsInput, setTuidsInput] = React.useState('');

React.useEffect(async () => {
    const res = await unigraph.runExecutable('$/executable/get-pinecone-status', {});
    setStatus(res);
}, []);

React.useEffect(() => {
    const subsId = getRandomInt();
    const domainUid = window.unigraph.getNamespaceMap()['$/entity/domains'].uid;
    const feedsUid = window.unigraph.getNamespaceMap()['$/entity/feeds'].uid;
    window.unigraph.subscribeToQuery(
        `(func: uid(tagUids)) {
        uid
        _value {
            name {
                <_value.%>
            }
        }
        <unigraph.origin> @filter(type(Entity) AND uid_in(<unigraph.origin>, ${feedsUid})) {
            uid
            type { <unigraph.id> }
        }
    }

    var(func: uid(${domainUid})) {
        _value {
            children {
                <_value[> {
                    <_value> {
                        _value {
                            tagUids as uid
                        }
                    }
                }
            }
        }
    }`,
        (tags) => {
            const newTags = tags.map((el) => ({
                uid: el.uid,
                name: el._value.name['_value.%'],
                count:
                    el['unigraph.origin']?.filter((origin) => origin?.type['unigraph.id'] !== '$/schema/subentity')
                        .length || 0,
                matches: (
                    el['unigraph.origin']?.filter((origin) => origin?.type['unigraph.id'] !== '$/schema/subentity') ||
                    []
                ).map((el) => el.uid),
            }));
            setTags((tags) => (tags.length === 0 ? newTags : tags));
        },
        subsId,
        { noExpand: true },
    );

    return () => {
        window.unigraph.unsubscribe(subsId);
    };
}, []);

return (
    <div>
        {status === false ? (
            'Loading'
        ) : (
            <div>
                <p>
                    <strong>Indexed vectors: </strong>
                    {status?.namespaces?.search?.vectorCount.toString() || 'error'}
                </p>
                <p>
                    <strong>Index fullness: </strong>
                    {status?.indexFullness}
                </p>
            </div>
        )}
        {tags.map((el) => (
            <div>
                <span>
                    Tag: {el.name}, items: {el.count}
                </span>
                <button
                    onClick={() => {
                        window.unigraph.updateTriplets(
                            el.matches.map((ell) => `<${ell}> <_tagged> * .`),
                            true,
                        );
                    }}
                >
                    Re-index all
                </button>
                <button
                    onClick={async () => {
                        window.unigraph.updateTriplets(
                            el.matches.map((ell) => `<${ell}> <_embedding> * .`),
                            true,
                        );
                    }}
                >
                    Reconstruct embeddings
                </button>
                <button
                    onClick={async () => {
                        const t = (
                            await window.unigraph.getQueries([
                                `(func: uid(${el.matches.join(', ')})) { _value { uid } }`,
                            ])
                        )[0];
                        const valUids = t.map((ell) => ell._value.uid);
                        window.unigraph.updateTriplets(
                            [
                                ...valUids.map((ell) => `<${ell}> <children> * .`),
                                ...el.matches.map((ell) => `<${el.uid}> <unigraph.origin> <${ell}> .`),
                            ],
                            true,
                        );
                    }}
                >
                    Remove tags
                </button>
                <button
                    onClick={() => {
                        setUidsInput(el.matches.join(','));
                        setTuidsInput(el.uid);
                    }}
                >
                    Get uids
                </button>
            </div>
        ))}
        <div>
            <input value={uidsInput} onChange={(ev) => setUidsInput(ev.target.value)} />
            <button
                onClick={() => {
                    window.unigraph.updateTriplets(
                        uidsInput.split(',').map((ell) => `<${ell}> <_tagged> * .`),
                        true,
                    );
                }}
            >
                Re-index all
            </button>
            <button
                onClick={async () => {
                    window.unigraph.updateTriplets(
                        uidsInput.split(',').map((ell) => `<${ell}> <_embedding> * .`),
                        true,
                    );
                }}
            >
                Reconstruct embeddings
            </button>
            <input value={tuidsInput} onChange={(ev) => setTuidsInput(ev.target.value)} />
            <button
                onClick={async () => {
                    const t = (
                        await window.unigraph.getQueries([
                            `(func: uid(${uidsInput.split(',').join(', ')})) { _value { uid } }`,
                        ])
                    )[0];
                    const valUids = t.map((ell) => ell._value.uid);
                    window.unigraph.updateTriplets(
                        [
                            ...valUids.map((ell) => `<${ell}> <children> * .`),
                            ...uidsInput.split(',').map((ell) => `<${tuidsInput}> <unigraph.origin> <${ell}> .`),
                        ],
                        true,
                    );
                }}
            >
                Remove tags
            </button>
        </div>
    </div>
);
