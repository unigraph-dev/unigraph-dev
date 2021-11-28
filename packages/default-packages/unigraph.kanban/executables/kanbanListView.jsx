const [kanbans, setKanbans] = React.useState([]);
const [newName, setNewName] = React.useState("");

React.useEffect(() => {
    const viewId = getRandomInt();

    unigraph.subscribeToType('$/schema/kanban', (kb) => {
        setKanbans(kb)
    }, viewId);

    return function cleanup () { unigraph.unsubscribe(viewId) }
}, [])

return <div>
    <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
    <Button onClick={() => unigraph.addObject({title: {_value: newName, type: {'unigraph.id': "$/schema/markdown"}}, children: [
        {name: "Todo", children: [], $context: {_hide: true}},
        {name: "Doing", children: [], $context: {_hide: true}},
        {name: "Done", children: [], $context: {_hide: true}},
    ]}, "$/schema/kanban")}>Add</Button>
    {kanbans.map(el => <AutoDynamicView object={new UnigraphObject(el)} />)}
</div>