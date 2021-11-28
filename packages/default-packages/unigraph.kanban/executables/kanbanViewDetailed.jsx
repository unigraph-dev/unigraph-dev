const {data, callbacks} = params;

const List = React.useMemo(() => {
    return ({column}) => {
        console.log(column)
        const listValue = column?.['_value']?.children
        return <Card style={{width: "270px", padding: "12px", margin: "8px"}} variant="outlined" >
            <Typography variant="body1"><strong>{column._value.name['_value.%']}</strong></Typography>
            <DynamicObjectListView
                items={listValue?.['_value['] || []} context={column} listUid={listValue?.uid} callbacks={{...callbacks}}
                itemGetter={(el) => el['_value']['_value']}
                noBar
                noRemover
                itemRemover={(uids) => {window.unigraph.deleteItemFromArray(listValue?.uid, uids, column['uid'], callbacks?.subsId || undefined)}}
            />
        </Card>
    }
}, [])

return <div>
    <Typography variant="h5" gutterBottom></Typography>
    <div style={{display: "flex"}}>
        {data.get('children')['_value['].sort(byElementIndex).map(el => <List column={el['_value']} />)}
    </div>
</div>