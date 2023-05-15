const [contacts, setContacts] = React.useState([]);
const [viewId, setViewId] = React.useState(getRandomInt());
const [newName, setNewName] = React.useState('');
const [newEmail, setNewEmail] = React.useState('');
const [newTags, setNewTags] = React.useState('');
const [newPfp, setNewPfp] = React.useState('');
const tabContext = React.useContext(TabContext);
React.useEffect(() => {
    tabContext.subscribeToType(
        '$/schema/contact',
        (kb) => {
            setContacts(kb);
        },
        viewId,
    );

    return function cleanup() {
        tabContext.unsubscribe(viewId);
    };
}, []);

return (
    <>
        <Typography variant="h5" sx={{ margin: '8px' }}>
            Contacts (Alpha)
        </Typography>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <TextField
                style={{ marginRight: '1rem' }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
            >
                Name
            </TextField>
            <TextField
                style={{ marginRight: '1rem' }}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
            >
                Email
            </TextField>
            <TextField
                style={{ marginRight: '1rem' }}
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="tag1, tag2"
            >
                Tags
            </TextField>
            <TextField
                style={{ marginRight: '1rem' }}
                value={newPfp}
                onChange={(e) => setNewPfp(e.target.value)}
                placeholder="Profile pic"
            >
                Profile
            </TextField>
            <Button
                onClick={async () => {
                    const uids = await unigraph.addObject(
                        {
                            emails: [newEmail],
                            name: newName,
                            profile_image: newPfp.length ? newPfp : undefined,
                            children: newTags
                                .split(',')
                                .map((el) => el.trim())
                                .map((tag) => ({
                                    type: {
                                        'unigraph.id': '$/schema/interface/semantic',
                                    },
                                    _value: {
                                        type: {
                                            'unigraph.id': '$/schema/tag',
                                        },
                                        _value: {
                                            name: tag,
                                        },
                                    },
                                })),
                        },
                        '$/schema/contact',
                        undefined,
                        [viewId],
                    );
                    unigraph.runExecutable('$/executable/migrate-person-to-contact', { uid: uids[0], email: newEmail });
                    setNewName('');
                    setNewEmail('');
                    setNewPfp('');
                    setNewTags('');
                }}
            >
                Add Contact
            </Button>
        </div>

        <DynamicObjectListView items={contacts.map((el) => new UnigraphObject(el))} context={null} />
    </>
);
