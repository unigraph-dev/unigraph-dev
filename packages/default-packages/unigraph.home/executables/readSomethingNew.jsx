const [count, setCount] = React.useState({
    "$/entity/inbox": 0,
    "$/entity/read_later": 0
});

React.useEffect(() => {
    const inboxUid = window.unigraph.getNamespaceMap()['$/entity/inbox'].uid;
    const readLaterUid = window.unigraph.getNamespaceMap()['$/entity/read_later'].uid;
    window.unigraph.getQueries([`(func: uid(${inboxUid})) @normalize { _value { children { <_value[> {items: count(uid)} } } }`, 
        `(func: uid(${readLaterUid})) @normalize { _value { children { <_value[> {items: count(uid)} } } }`]).then((results) => {
            setCount({
                "$/entity/inbox": results[0][0].items,
                "$/entity/read_later": results[1][0].items
            })
        })
}, []);

return <div>
    <Typography> You have {count['$/entity/inbox'].toString()} items in your inbox.</Typography>
    <Typography> You have {count['$/entity/read_later'].toString()} items in your read later feed.</Typography>
</div>