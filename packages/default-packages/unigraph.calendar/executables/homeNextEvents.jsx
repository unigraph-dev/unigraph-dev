const [events, setEvents] = React.useState([]);

React.useEffect(() => {
    const fn = async () => {
        const els = await unigraph.getQueries([
            `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @recurse {
    uid
    <unigraph.id>
    expand(_userpredicate_)
}
frames as var(func: uid(partf)) @cascade {
    _value {
        end {
            _value {
                _value {
                    datetime @filter(ge(<_value.%dt>, "${new Date().toJSON()}") AND le(<_value.%dt>, "${new Date(
                new Date().getTime() + 1000 * 60 * 60 * 24,
            ).toJSON()}")) {
                        <_value.%dt>
                    }
                }
            }
        }
    }
}
var(func: eq(<unigraph.id>, "$/schema/time_frame")) {
    <~type> {
        partf as uid
    }
}
var(func: uid(frames)) {
    <unigraph.origin> {
        res as uid
    }
}`,
        ]);
        setEvents(els[0]);
    };

    const interval = setInterval(fn, 120000);
    fn();

    return function cleanup() {
        clearInterval(interval);
    };
}, []);

return (
    <DynamicObjectListView
        items={events}
        groupBy="time_frame"
        groupers={{
            time_frame: (els) => {
                els = buildGraph(els);
                const groups = {};
                groups[Sugar.Date.medium(new Date())] = [];
                els.filter((el) => el.type['unigraph.id'] === '$/schema/time_frame').forEach((el) => {
                    const dd = Sugar.Date.medium(
                        new Date(new UnigraphObject(el).get('start/datetime').as('primitive')),
                    );
                    if (groups[dd]) groups[dd].push(el);
                    else groups[dd] = [el];
                });
                // 2. Go through groups and find all entities associated with these timeframes
                const finalGroups = [];
                Object.entries(groups)
                    .sort((a, b) => Sugar.Date.create(a[0]).getTime() - Sugar.Date.create(b[0]).getTime())
                    .map(([key, value]) => {
                        const insert = { name: key, items: [] };
                        value
                            .sort(
                                (a, b) =>
                                    Sugar.Date.create(
                                        new Date(new UnigraphObject(a).get('start/datetime').as('primitive')),
                                    ).getTime() -
                                    Sugar.Date.create(
                                        new Date(new UnigraphObject(b).get('start/datetime').as('primitive')),
                                    ).getTime(),
                            )
                            .map((val) => {
                                els.filter((el) => el.type['unigraph.id'] !== '$/schema/time_frame').forEach((el) => {
                                    if (JSON.stringify(unpad(el, false)).includes(val._value.uid))
                                        insert.items.push(el);
                                });
                            });
                        finalGroups.push(insert);
                    });
                return finalGroups;
            },
        }}
        callbacks={{ noDate: true }}
        context={null}
        noBar
        compact
    />
);
