const [events, setEvents] = React.useState([]);

React.useEffect(() => {
    const fn = () => {
        unigraph.runExecutable('$/executable/get-next-events', 
            {
                current: true, start: (new Date((new Date()).getTime() + 1000*60*60*8)).getTime(), 
                greaterThanNow: true, allEnd: true
            }
        ).then(async (query) => {
            const events = (await unigraph.getQueries([query]))?.[0];
            setEvents(buildGraph(events).filter(el => el['type']['unigraph.id'] !== "$/schema/time_frame"));
        })
    };

    const interval = setInterval(fn, 120000);
    fn();

    return function cleanup () {
        clearInterval(interval);
    }

}, []);

return <React.Fragment>
    {events.map(el => <AutoDynamicView object={new UnigraphObject(el)} callbacks={{noDate: true}}/>)}
</React.Fragment>