const [pages, setPages] = React.useState([]);
const tabContext = React.useContext(TabContext);

const noteQuery = (uid) => `(func: uid(${uid})) {
    _updatedAt
    uid
    _hide
    <~_value> {
        type { <unigraph.id> }
        <unigraph.origin> @filter(NOT eq(_hide, true)) {
            type { <unigraph.id> }
            uid
        }
    }
    <unigraph.origin> @filter(NOT eq(_hide, true)) {
        type { <unigraph.id> }
        uid
    }
    type {
        uid
        <unigraph.id>
    }
    _value {
        uid
        text {
            uid
            _value {
                _value {
                    <dgraph.type>
                    uid type { uid <unigraph.id> }
                    <_value.%>
                }
                uid type { uid <unigraph.id> }
            }
        }
        name {
            <_value.%>
        }
        content {
            uid
            _value {
                uid
                type { uid <unigraph.id> }
            }
        }
        children {
            uid
            <_displayAs>
            <_value[> {
                uid
                <_index> { uid <_value.#i> }
                <_key>
                <_value> @filter(uid_in(type, $unigraph.id{$/schema/subentity})) {
                    _hide
                    _value { uid _hide type {uid <unigraph.id>} }
                    uid
                    type { uid <unigraph.id> }
                }
                <_value> @filter(uid_in(type, $unigraph.id{$/schema/interface/semantic})) {
                    _hide
                    _value { uid type { uid <unigraph.id> } _stub: math(1) _value {
                        name { <_value.%> }
                    }}
                    uid
                    type { uid <unigraph.id> }
                }
            }
        }
    }
}`;

React.useEffect(() => {
    const subsId = getRandomInt();

    tabContext.subscribeToObject(
        '$/entity/obsidian_synced_notes',
        (synced) => {
            const notes = (synced['_value['] || []).map((el) => el['_value']);
            setPages(notes);
        },
        subsId,
        {
            queryFn: `(func: uid(QUERYFN_TEMPLATE)) {
                uid
            <_value[> {
                <_value> {
                  uid
                  type { <unigraph.id> }
                }
              }
        }`,
        },
    );

    return () => tabContext.unsubscribe(subsId);
}, []);

return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Typography variant="h4" gutterBottom>
            Obsidian sync settings
        </Typography>
        <Typography variant="h5" gutterBottom>
            Pages synced with Obsidian
        </Typography>
        <DynamicObjectListView
            items={pages}
            context={null}
            subscribeOptions={{
                queryAsType: '$/schema/note_block',
                depth: 9,
                queryFn: noteQuery,
            }}
            itemAdder={(uid) => {
                unigraph.runExecutable('$/executable/update-uid-list', {
                    uids: [uid],
                    listUid: '$/entity/obsidian_synced_notes',
                });
            }}
        />
    </div>
);
