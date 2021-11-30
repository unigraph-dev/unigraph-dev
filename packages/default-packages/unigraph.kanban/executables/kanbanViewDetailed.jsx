const {data, callbacks} = params;

const List = React.useMemo(() => {
    return ({column}) => {
        const listValue = column?.['_value']?.children
        return <Card style={{width: "360px", minWidth: "360px", padding: "12px", margin: "8px", height: "100%", overflow: "scroll"}} variant="outlined" >
            <Typography variant="body1"><b>{column._value.name['_value.%']}</b></Typography>
            <DynamicObjectListView
                items={(listValue?.['_value['] || []).sort(byElementIndex) || []} context={column} listUid={listValue?.uid} callbacks={{...callbacks}}
                itemGetter={(el) => el['_value']['_value']}
                noBar noRemover compact defaultFilter={[]}
                itemRemover={(uids) => {window.unigraph.deleteItemFromArray(listValue?.uid, uids, column['uid'], callbacks?.subsId || undefined)}}
            />
            <Typography onClick={() => {
                unigraph.getState('global/omnibarSummoner').setValue({
                    show: true,
                    tooltip: "Press Enter to add current item to current Kanban column",
                    callback: (uid) => {
                        unigraph.runExecutable('$/executable/add-item-to-list', { where: column.uid, item: uid });
                    },
                    defaultValue: "+",
                })
            }} style={{marginTop: "8px", color: "grey"}}>+ Add card</Typography>
        </Card>
    }
}, [])

const SetBgim = React.useMemo(() => {
    return ({handleClose}) => {

        const [bgimText, setBgimText] = React.useState("");
    
        return <div style={{paddingTop: "2px", paddingBottom: "2px"}}>
            <Typography style={{color: "grey"}}>Set new background image</Typography>
            <TextField value={bgimText} onChange={(e) => {
                setBgimText(e.target.value);
            }}></TextField>
            <Button onClick={() => {handleClose(); unigraph.updateObject(data.uid, {_backgroundImage: bgimText}, false, false)}}>Set</Button>
        </div>
    }
}, [])

const AddBoard = React.useMemo(() => {
    return ({handleClose}) => {

        const [newText, setNewText] = React.useState("");
    
        return <div style={{paddingTop: "2px", paddingBottom: "2px"}}>
            <Typography style={{color: "grey"}}>Add new board</Typography>
            <TextField value={newText} onChange={(e) => {
                setNewText(e.target.value);
            }}></TextField>
            <Button onClick={() => {handleClose(); unigraph.updateObject(data.uid, {children: [{
                type: {"unigraph.id": "$/schema/list"},
                _value: {
                    name: newText, children: [], $context: {_hide: true}
                }
            }]})}}>Add</Button>
        </div>
    }
}, [])

return <div style={{padding: "24px", overflow: "scroll", ...(data?._backgroundImage ? {backgroundImage: `url(${data?._backgroundImage})`, backgroundSize: "cover"}: {}), height: "100%", width: "100%"}}>
    <div style={{display: "flex"}}>
        <Typography variant="h5" gutterBottom style={{marginTop: "8px", width: "100%"}}>{data.get('title').as('primitive')}</Typography>
        <MoreVert onClick={(event) => onUnigraphContextMenu(event, data, undefined, callbacks, (uid, object, handleClose, callbacks) => {return <div>
            <SetBgim handleClose={handleClose} />
            <AddBoard handleClose={handleClose} />
        </div>})} style={{marginLeft: "8px"}}/>
        </div>
    <div style={{display: "flex"}}>
        {data.get('children')['_value['].sort(byElementIndex).filter(el => el?._value?.type?.['unigraph.id'] === "$/schema/list").map(el => <List column={el['_value']} />)}
    </div>
</div>