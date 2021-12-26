const [note, setNote] = React.useState({});
// window.unigraph.addObject({date:{datetime:utcTime, all_day:true, timezone:'local'}, note:{text: {_value: '', type: {'unigraph.id': "$/schema/markdown"}}}},'$/schema/journal')
React.useEffect(() => {
    const subsId = getRandomInt();
    const d = new Date()
    const utcTime = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)).getTime()
    window.unigraph.subscribeToQuery(
        `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @recurse {
            uid
            <unigraph.id>
            expand(_userpredicate_)
        }
        point as var(func: uid(partf)) @cascade {
            _value {
                datetime @filter(eq(<_value.%dt>, ${utcTime})) {
                    <_value.%dt>
                }
            }
        }
        var(func: eq(<unigraph.id>, "$/schema/time_point")) {
            <~type> {
                partf as uid
            }
        }
        var(func: uid(point)) {
            <unigraph.origin> {
                res as uid
            }
        }`
,
    (results) => {
        console.log('',{results})
        setNote(results?.[0]?.[0])
    }, subsId, true);

    return function cleanup () {
        window.unigraph.unsubscribe(subsId);
    }
}, []);

return (note ? JSON.stringify(note) : 'no note yet')