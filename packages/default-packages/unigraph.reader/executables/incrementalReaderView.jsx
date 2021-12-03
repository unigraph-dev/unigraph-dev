const {data, callbacks, ...props} = params;
console.log(data);
return <div style={{display: "flex"}}>
    <div style={{marginRight: "16px"}} onClick={() => {
        // Now we load it to the detailed view
        const htmlUid = data._value.item._value.uid
        const ctxUid = data._value.context._value.uid
        if (htmlUid) window.wsnavigator('/library/object?uid=' + data.uid+ `&type=${data?.type?.['unigraph.id']}`);
        if (callbacks?.removeFromContext) callbacks.removeFromContext();
        window.unigraph.deleteObject(data.uid);
    }}>
        <p>{data._value.percent["_value.#i"]}%</p>
        <p>&gt;&gt;</p>
    </div>
    <AutoDynamicView object={new UnigraphObject(data._value.context._value)}/>
</div>