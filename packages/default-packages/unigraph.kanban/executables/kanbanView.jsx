const {data, callbacks} = params;

return <Card style={{padding: "8px", margin: "8px", width: "100%"}} variant="outlined" onClick={() => {
    window.wsnavigator('/library/object?uid=' + data.uid)
}}>
    <Typography>{data.get('title').as('primitive')}</Typography>
    <Typography style={{color: "grey"}} variant="body2">{data?._value?.children?.["_value["]?.length || "No"} columns</Typography>
</Card>