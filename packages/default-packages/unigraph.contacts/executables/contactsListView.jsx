const [contacts, setContacts] = React.useState([]);
const [newName, setNewName] = React.useState('');
const [newEmail, setNewEmail] = React.useState('');
const tabContext = React.useContext(TabContext);
React.useEffect(() => {
    const viewId = getRandomInt();

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
            Contacts
        </Typography>
        <div>
            <TextField value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name">
                Name
            </TextField>
            <TextField value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email">
                Email
            </TextField>
            <Button onClick={() => unigraph.addObject({ emails: [newEmail], name: newName }, '$/schema/contact')}>
                Add Contact
            </Button>
            {contacts.map((el) => (
                <AutoDynamicView object={new UnigraphObject(el)} />
            ))}
        </div>
    </>
);
