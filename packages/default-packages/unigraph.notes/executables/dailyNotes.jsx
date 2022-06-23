const d = new Date();
const getUtcTime = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
const getDateStr = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const utcTime = getUtcTime(d).toISOString();
const tabContext = React.useContext(TabContext);
const [today, setToday] = React.useState(getStartOfDay(d).toISOString());
const [note, setNote] = React.useState({});
const [subsId, setSubsId] = React.useState(getRandomInt());

React.useEffect(() => {
    const newSubs = getRandomInt();
    setSubsId(newSubs);

    tabContext.subscribeToQuery(
        `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @cascade {
            uid
            type @filter(eq(<unigraph.id>, "$/schema/journal")) { <unigraph.id> }
            _value {
                note {
                    _value {
                        uid
                        type { <unigraph.id> }
                        _stub: math(1)
                    }
                }
            }
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

        newSubs,

        { noExpand: true },
    );

    return function cleanup() {
        tabContext.unsubscribe(newSubs);
    };
}, [today]);

const [templates, setTemplates] = React.useState([]);
React.useEffect(() => {
    const tempSubs = getRandomInt();
    tabContext.subscribeToQuery(
        `(func: uid(${window.unigraph.getNamespaceMap()['$/entity/templates_list'].uid})) @normalize {
            _value {
                children {
                    <_value[> {
                        _value {
                            _value {
                                id: uid
                                _value {
                                    text {
                                        _value {
                                            _value {
                                                name: <_value.%>
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }`,
        (res) => {
            setTemplates(res);
        },
        tempSubs,
        { noExpand: true },
    );
    return () => tabContext.unsubscribe(tempSubs);
}, []);

const [hoveredOffset, setHoveredOffset] = React.useState(-1);
const WeekView = React.useCallback(
    ({ start }) => {
        return (
            <div style={{ display: 'flex' }}>
                <span
                    onClick={() => {
                        setToday(Sugar.Date.addDays(new Date(today), -1).toISOString());
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

const addDailyNote = (template) => {
    const leasedUid = window.unigraph.leaseUid();
    window.unigraph.addObject(
        {
            date: {
                datetime: getUtcTime(new Date(today)).toISOString(),
                all_day: true,
                timezone: 'local',
            },
            note: {
                uid: leasedUid,
                text: {
                    _value: getDateStr(new Date(today)),
                    type: { 'unigraph.id': '$/schema/markdown' },
                },
            },
        },
        '$/schema/journal',
        false,
        template ? [] : [subsId],
    );
    if (template) {
        window.unigraph.runExecutable('$/executable/apply-template', {
            templateUid: template,
            uid: leasedUid,
            subsId,
        });
    }
};

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
                        <AutoDynamicViewDetailed object={note._value.note._value} />
                    </div>
                ) : note ? (
                    <div style={{ margin: '16px', color: 'gray' }}>Loading...</div>
                ) : (
                    <div style={{ display: 'flex' }}>
                        <Button
                            style={{ textTransform: 'none', marginTop: '8px', margin: '16px' }}
                            variant="outlined"
                            onClick={() => addDailyNote()}
                        >
                            + Add daily note
                        </Button>
                        {templates.length > 0 ? (
                            <>
                                <Divider orientation="vertical" flexItem variant="middle" />
                                {templates.map((el) => (
                                    <Button
                                        style={{ textTransform: 'none', marginTop: '8px', margin: '16px' }}
                                        variant="outlined"
                                        onClick={() => addDailyNote(el.id)}
                                    >
                                        + Add template: {el.name}
                                    </Button>
                                ))}
                            </>
                        ) : null}
                    </div>
                )
            }
        </div>
    </div>
);
