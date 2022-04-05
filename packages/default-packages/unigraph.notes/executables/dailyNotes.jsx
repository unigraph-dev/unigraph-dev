const d = new Date();
const getUtcTime = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
const getDateStr = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const utcTime = getUtcTime(d).toISOString();
const tabContext = React.useContext(TabContext);
const [today, setToday] = React.useState(getStartOfDay(d).toISOString());
const [note, setNote] = React.useState({});

React.useEffect(() => {
    const subsId = getRandomInt();

    tabContext.subscribeToQuery(
        `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @cascade {
            uid
            type @filter(eq(<unigraph.id>, "$/schema/journal")) { <unigraph.id> }
        }
        point as var(func: uid(partf)) @cascade {
            _value {
                datetime @filter(eq(<_value.%dt>, "${getUtcTime(new Date(today)).toISOString()}")) {
                    <_value.%dt>
                }
            }
        }
        var(func: eq(<unigraph.id>, "$/schema/time_point")) {
            <~type> {
                partf as uid
            }
        }
        var(func: uid(point)) @cascade {
            <unigraph.origin> {
                res as uid
            }
        }`,
        (results) => {
            console.log('', { results });
            setNote(results?.[0]);
        },

        subsId,

        { noExpand: true },
    );

    return function cleanup() {
        tabContext.unsubscribe(subsId);
    };
}, [today]);

const [hoveredOffset, setHoveredOffset] = React.useState(-1);
const WeekView = React.useCallback(
    ({ start }) => {
        return (
            <div style={{ display: 'flex' }}>
                <span
                    onClick={() => {
                        setToday(Sugar.Date.addDays(new Date(today), -1).toISOString());
                        setNote({});
                    }}
                    style={{ color: 'rgb(145, 145, 168)', alignSelf: 'center', cursor: 'pointer' }}
                >
                    <ChevronLeft />
                </span>
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const dated = Sugar.Date.addDays(new Date(start), offset);
                    const selected = dated.toISOString() === today;
                    return (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                margin: '2px',
                                alignItems: 'center',
                                minWidth: '48px',
                                // eslint-disable-next-line no-nested-ternary
                                backgroundColor: selected ? '#e8ecff' : hoveredOffset === offset ? '#f4f4fa' : '',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                            onMouseOver={() => setHoveredOffset(offset)}
                            onFocus={() => setHoveredOffset(offset)}
                            onMouseLeave={() => setHoveredOffset(-1)}
                            onClick={() => {
                                setToday(Sugar.Date.addDays(new Date(start), offset).toISOString());
                                setNote({});
                            }}
                        >
                            <span style={{ color: selected ? '#3668ff' : '#9191a8' }}>
                                {Sugar.Date.format(new Date(dated), '{Dow}')}
                            </span>
                            <span style={{ color: selected ? '#3668ff' : '' }}>
                                {Sugar.Date.format(new Date(dated), '{d}')}
                            </span>
                        </div>
                    );
                })}
                <span
                    onClick={() => {
                        setToday(Sugar.Date.addDays(new Date(today), 1).toISOString());
                        setNote({});
                    }}
                    style={{ color: 'rgb(145, 145, 168)', alignSelf: 'center', cursor: 'pointer' }}
                >
                    <ChevronRight />
                </span>
            </div>
        );
    },
    [today, hoveredOffset],
);

return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', padding: '16px' }}>
            <div style={{ flexGrow: 1, marginRight: '16px' }}>
                <span style={{ fontWeight: 300, color: 'gray' }}>Journal</span>
                <br />
                <span style={{ fontWeight: 'bold' }}>{Sugar.Date.format(new Date(today), '%B')}</span>{' '}
                {new Date(today).getUTCFullYear()}
            </div>
            <WeekView start={Sugar.Date.beginningOfWeek(new Date(today)).toISOString()} />
        </div>

        <Divider />
        <div style={{ overflowX: 'auto' }}>
            {
                // eslint-disable-next-line no-nested-ternary
                note && note?.type?.['unigraph.id'] === '$/schema/journal' ? (
                    <div style={{ display: 'flex' }}>
                        <AutoDynamicViewDetailed object={note} />
                    </div>
                ) : note ? (
                    <div style={{ margin: '16px', color: 'gray' }}>Loading...</div>
                ) : (
                    <div>
                        <Button
                            style={{ textTransform: 'none', marginTop: '8px', margin: '16px' }}
                            variant="outlined"
                            onClick={() => {
                                window.unigraph.addObject(
                                    {
                                        date: {
                                            datetime: getUtcTime(new Date(today)).toISOString(),
                                            all_day: true,
                                            timezone: 'local',
                                        },
                                        note: {
                                            text: {
                                                _value: getDateStr(new Date(today)),
                                                type: { 'unigraph.id': '$/schema/markdown' },
                                            },
                                        },
                                    },
                                    '$/schema/journal',
                                );
                            }}
                        >
                            + Add daily note
                        </Button>
                    </div>
                )
            }
        </div>
    </div>
);
