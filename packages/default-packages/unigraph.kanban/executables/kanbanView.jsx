const {data, callbacks} = params;

return <Card style={{padding: "8px", margin: "8px", width: "100%", ...(data?._backgroundImage ? {backgroundImage: `url(${data?._backgroundImage})`, backgroundSize: "cover"}: {})}} variant="outlined" onClick={() => {
    window.wsnavigator('/library/object?uid=' + data.uid + `&type=${data?.type?.['unigraph.id']}`)
}}>
    <Typography>{data.get('title').as('primitive')}</Typography>
    <Typography style={{color: "grey"}} variant="body2">{data?._value?.children?.["_value["]?.length || "No"} columns</Typography>
</Card>