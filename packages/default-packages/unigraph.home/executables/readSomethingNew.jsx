const [count, setCount] = React.useState({
    '$/entity/inbox': 0,
    '$/entity/read_later': 0,
});
const tabContext = React.useContext(TabContext);
React.useEffect(() => {
    const subsId = getRandomInt();
    const inboxUid = window.unigraph.getNamespaceMap()['$/entity/inbox'].uid;
    const readLaterUid = window.unigraph.getNamespaceMap()['$/entity/read_later'].uid;
    tabContext.subscribeToQuery(
        `(func: uid(${inboxUid}, ${readLaterUid})) @normalize { uid: uid _value { children { <_value[> {items: count(uid)} } } }`,
        (results) => {
            const ibx = results[0].uid === inboxUid ? results[0] : results[1];
            const rlt = results[0].uid === readLaterUid ? results[0] : results[1];
            setCount({
                '$/entity/inbox': ibx?.items || 0,
                '$/entity/read_later': rlt?.items || 0,
            });
        },
        subsId,
        { noExpand: true },
    );

    return function cleanup() {
        tabContext.unsubscribe(subsId);
    };
}, []);

return (
    <div>
        <Typography>
            You have
            {' '}
            {count['$/entity/inbox'].toString()}
            {' '}
            items in your inbox.
        </Typography>
        <Typography>
            You have
            {' '}
            {count['$/entity/read_later'].toString()}
            {' '}
            items in your read later feed.
        </Typography>
    </div>
);
