const [tags, setTags] = React.useState([]);
const [tag, setTag] = React.useState(false);
const [objects, setObjects] = React.useState({ uid: '', items: [] });
const [ctx, setCtx] = React.useState(undefined);
const [subsIds, setSubsIds] = React.useState([]);
const [collapsed, setCollapsed] = React.useState(false);
const [isMobile, setIsMobile] = React.useState(false);

const mobileStyle = {
    position: 'absolute',
    zIndex: !collapsed ? 999999 : -999999,
    opacity: !collapsed ? 1 : 0,
    transition: 'opacity 0.2ms',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0)',
};

const getQuery = React.useCallback(
    (tag) => `(func: uid(${tag.matches.join(', ')})) {
  uid
  type { <unigraph.id> }
  _stub: math(1)
}`,
    [tag],
);

React.useEffect(() => {
    const subsId = getRandomInt();
    const subsId2 = getRandomInt();
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
            setTags(newTags);
            setTag((ttag) => (ttag?.uid ? newTags.find((el) => el.uid === ttag.uid) : ttag));
        },
        subsId,
        { noExpand: true },
    );

    window.unigraph.subscribeToObject(
        feedsUid,
        (ctx) => {
            setCtx(ctx);
        },
        subsId2,
        {
            queryFn: `(func: uid(${feedsUid})) {
    _value {
        name { <_value.%> }
        children { uid <_value[> {
            _index {
                <_value.#i>
            }
            _value { 
                uid
                type { <unigraph.id> }
                _value {
                    uid
                    type { <unigraph.id> }
                }
            }
        } }
    }
    uid
    type { <unigraph.id> }
}`,
        },
    );
    setSubsIds([subsId, subsId2]);
    return () => {
        window.unigraph.unsubscribe(subsId);
        window.unigraph.unsubscribe(subsId2);
    };
}, []);

React.useEffect(() => {
    if (tag?.uid?.startsWith('0x')) {
        const id = getRandomInt();
        window.unigraph.subscribeToQuery(
            getQuery(tag),
            (newObjs) => {
                const finalObjs = buildGraph(newObjs).filter((el) => el.uid !== tag.uid);
                finalObjs.reverse();
                setObjects({ uid: tag.uid, items: finalObjs });
            },
            id,
            { noExpand: true },
        );
        return function cleanup() {
            window.unigraph.unsubscribe(id);
        };
    }
}, [tag]);

return tags.length ? (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <div style={{ display: 'flex', ...(isSmallScreen() || isMobile ? mobileStyle : {}) }}>
            <div
                style={{
                    height: '100%',
                    overflowY: 'auto',
                    padding: '8px',
                    backgroundColor: isSmallScreen() || isMobile ? 'white' : '',
                }}
            >
                <Typography
                    gutterBottom
                    variant="body1"
                    style={{
                        paddingLeft: '10px',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        color: 'gray',
                        fontWeight: 600,
                    }}
                >
                    Tags
                </Typography>
                {tags
                    .filter((el) => el.name !== 'uncategorized')
                    .map((el) => (
                        <div
                            style={{
                                padding: '8px',
                                display: 'flex',
                                cursor: 'pointer',
                                backgroundColor: tag.uid === el.uid ? '#f3f3f3' : '',
                                borderRadius: '6px',
                            }}
                            onClick={() => {
                                setTag(el);
                                if (isSmallScreen() || isMobile) setCollapsed(true);
                            }}
                        >
                            <Tag
                                style={{
                                    opacity: 0.57,
                                    transform: 'scale(0.8)',
                                    fill: tag.uid === el.uid ? '#1c1cff' : '',
                                }}
                            />
                            <Typography style={{ flexGrow: 1 }}>{el.name}</Typography>
                            <Typography style={{ marginLeft: '16px' }}>{el.count}</Typography>
                        </div>
                    ))}
                <Divider variant="middle" style={{ marginTop: '12px', marginBottom: '12px' }} />
                {tags
                    .filter((el) => el.name === 'uncategorized')
                    .map((el) => (
                        <div
                            style={{
                                padding: '8px',
                                display: 'flex',
                                cursor: 'pointer',
                                backgroundColor: tag.uid === el.uid ? '#f3f3f3' : '',
                                borderRadius: '6px',
                            }}
                            onClick={() => {
                                setTag(el);
                                if (isSmallScreen() || isMobile) setCollapsed(true);
                            }}
                        >
                            <Tag
                                style={{
                                    opacity: 0.57,
                                    transform: 'scale(0.8)',
                                    fill: tag.uid === el.uid ? '#1c1cff' : '',
                                }}
                            />
                            <Typography style={{ flexGrow: 1 }}>{el.name}</Typography>
                            <Typography style={{ marginLeft: '16px' }}>{el.count}</Typography>
                        </div>
                    ))}
                <Divider variant="middle" style={{ marginTop: '12px', marginBottom: '12px' }} />
                <div
                    style={{ padding: '8px', display: 'flex', cursor: 'pointer' }}
                    onClick={() => window.wsnavigator('/feeds')}
                >
                    <Launch style={{ opacity: 0.57, transform: 'scale(0.7)' }} />
                    <Typography style={{ flexGrow: 1 }}>View all feed</Typography>
                </div>
            </div>
            <div
                style={{ flexGrow: 1, height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => setCollapsed(true)}
            />
        </div>
        {!collapsed ? <Divider orientation="vertical" flexItem /> : null}
        {collapsed ? (
            <div
                onClick={() => setCollapsed(false)}
                style={{
                    position: 'absolute',
                    zIndex: 999999,
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'black',
                    lineHeight: '24px',
                    height: '24px',
                    width: '24px',
                    borderRadius: '6px',
                }}
            >
                <ChevronRight style={{ fill: 'white' }} />
            </div>
        ) : (
            ''
        )}
        {!collapsed && !isMobile ? (
            <div
                onClick={() => {
                    setIsMobile(true);
                }}
                style={{
                    position: 'absolute',
                    zIndex: 999999,
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'black',
                    lineHeight: '24px',
                    height: '24px',
                    width: '24px',
                    borderRadius: '6px',
                }}
            >
                <ChevronLeft style={{ fill: 'white' }} />
            </div>
        ) : (
            ''
        )}
        <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="h5" sx={{ margin: '8px' }}>
                {tag?.name || ''}
            </Typography>
            {tag?.uid ? (
                <DynamicObjectListView
                    key={tag.name}
                    items={objects.uid === tag.uid ? objects.items : []}
                    autoRemove
                    titleBar=" feed items"
                    context={ctx}
                    itemRemover={(uids) => {
                        window.unigraph.deleteItemFromArray(ctx._value.children.uid, uids, ctx.uid, subsIds);
                    }}
                    compact
                />
            ) : (
                ''
            )}
        </div>
    </div>
) : (
    ''
);
