const [hotkeyBindings, setHotkeyBindings] = React.useState([]);

const tabContext = React.useContext(TabContext);

React.useEffect(() => {
    const id = getRandomInt();
    tabContext.subscribeToType(
        `$/schema/hotkey_binding`,
        (res) => {
            console.log('hotkeySettings 1', { res, hotkeyBindings });
            setHotkeyBindings(res);
        },
        id,
    );
    return function cleanup() {
        tabContext.unsubscribe(id);
    };
}, []);

const hotkeyBindingView = React.useCallback((binding) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row' }}>
        <span>{binding.get('command').get('name').as('primitive')}</span>
        <span>{binding.get('hotkey').as('primitive')}</span>
    </div>
));

return (
    <div>
        {/* <Typography variant="h4">Hotkey settings</Typography> */}
        <h1>Hotkey settings</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', fontWeight: 'bold' }}>
                <span>Command</span>
                <span>Binding</span>
            </div>
            {hotkeyBindings && hotkeyBindings.map(hotkeyBindingView)}
            {/* 
        {hotkeyBindings.map((binding) => (
            <p>binding.get('hotkey').as('primitive')</p>
        ))} */}
        </div>
    </div>
);
