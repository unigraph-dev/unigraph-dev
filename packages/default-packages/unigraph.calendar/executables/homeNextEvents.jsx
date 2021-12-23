const [events, setEvents] = React.useState([]);

React.useEffect(() => {
    const fn = () => {
        unigraph.runExecutable('$/executable/get-next-events', 
            {
                current: true, start: (new Date((new Date()).getTime() + 1000*60*60*24)).getTime(), 
                greaterThanNow: true, allEnd: true
            }
        ).then(async (query) => {
            let els = await unigraph.getQueries([query]);
            setEvents(els[0]);
        })
    };

    const interval = setInterval(fn, 120000);
    fn();

    return function cleanup () {
        clearInterval(interval);
    }

}, []);

return <React.Fragment>
    <DynamicObjectListView items={events} groupBy={"time_frame"} groupers={{time_frame: (els) => {
        els = buildGraph(els);
        let groups = {};
        groups[Sugar.Date.medium(new Date())] = []
        els.filter(el => el.type['unigraph.id'] === "$/schema/time_frame").forEach(el => {
            const dd = Sugar.Date.medium(new Date((new UnigraphObject(el)).get('start/datetime').as('primitive')));
            if (groups[dd]) groups[dd].push(el);
            else groups[dd] = [el];
        });
        // 2. Go through groups and find all entities associated with these timeframes
        let finalGroups = [];
        Object.entries(groups).sort((a, b) => Sugar.Date.create(a[0]).getTime() - Sugar.Date.create(b[0]).getTime()).map(([key, value]) => {
            const insert = {name: key, items: []}
            value.sort((a, b) => Sugar.Date.create(new Date((new UnigraphObject(a)).get('start/datetime').as('primitive'))).getTime() - Sugar.Date.create(new Date((new UnigraphObject(b)).get('start/datetime').as('primitive'))).getTime()).map((val) => {
                els.filter(el => el.type['unigraph.id'] !== "$/schema/time_frame").forEach(el => {
                    if (JSON.stringify(unpad(el, false)).includes(val._value.uid)) insert.items.push(el);
                })
            })
            finalGroups.push(insert)
        });
        return finalGroups;
    }}} callbacks={{noDate: true}} context={null} noBar compact/>
</React.Fragment>