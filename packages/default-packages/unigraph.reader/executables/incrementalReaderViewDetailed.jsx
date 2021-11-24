const {data, callbacks, ...props} = params;
const htmlUid = data._value.item._value
const ctxUid = data._value.context._value

React.useEffect(() => {
    return function cleanup () {
        window.unigraph.deleteObject(data, true);
    }
}, [])

return <AutoDynamicViewDetailed object={new UnigraphObject(htmlUid)} context={new UnigraphObject(ctxUid)} callbacks={{
    onLoad: (iframeRef) => {
        const doc = iframeRef.current.contentDocument;
        const win = iframeRef.current.contentWindow;
        const all = doc.body.querySelectorAll("*");
        const htmls = JSON.parse(data._value.progress["_value.%"])
        for (let i=0, max=all.length; i < max; i++) {
            if (i !== 0 && all[i-1].outerHTML === htmls[0] && all[i].outerHTML === htmls[1] && all[i+1].outerHTML === htmls[2]) {
                console.log(all[i]);
                all[i].scrollIntoView(true);
                all[i].style.backgroundColor = "aliceblue";
            }
        }
    }
}}/>