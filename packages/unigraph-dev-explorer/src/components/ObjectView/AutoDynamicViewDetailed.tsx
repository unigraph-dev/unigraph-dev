import { Typography } from "@material-ui/core";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { DynamicViewRenderer } from "../../global";
import { TabContext } from "../../utils";
import { ObjectEditor } from "../ObjectEditor/ObjectEditor";
import { isStub } from "./utils";

export const AutoDynamicViewDetailed: DynamicViewRenderer = ({ object, options, callbacks, context, component, attributes, useFallback = true }) => {

    const isObjectStub = isStub(object)
    const [loadedObj, setLoadedObj] = React.useState<any>(false)
    const [subsId, setSubsId] = React.useState(getRandomInt());

    const [DynamicViewsDetailed, setDynamicViewsDetailed] = React.useState({...window.unigraph.getState('registry/dynamicViewDetailed').value, ...(component || {})});

    React.useEffect(() => {
        window.unigraph.getState('registry/dynamicViewDetailed').subscribe(newIts => setDynamicViewsDetailed(newIts));
    }, [])

    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub && Object.keys(DynamicViewsDetailed).includes(object.type?.['unigraph.id'])) {
            const query = DynamicViewsDetailed[object.type['unigraph.id']].query(object.uid)
            window.unigraph.subscribeToQuery(query, (objects: any[]) => {
                setLoadedObj(objects[0]);
            }, newSubs, true);
            setSubsId(newSubs);
        }

        if (Object.keys(DynamicViewsDetailed).includes(object?.type?.['unigraph.id'])) {
            tabContext.setMaximize(DynamicViewsDetailed[object.type['unigraph.id']].maximize)
        }

        return function cleanup () { window.unigraph.unsubscribe(newSubs); }
    }, [object])

    if (isObjectStub) callbacks = {...callbacks, subsId}
    
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViewsDetailed).includes(object.type['unigraph.id']) && ((isObjectStub && loadedObj) || !isObjectStub)) {
        return <ErrorBoundary FallbackComponent={(error) => <div>
            <Typography>Error in detailed AutoDynamicView: </Typography>
            <p>{JSON.stringify(error, null, 4)}</p>
        </div>}>
        <TabContext.Consumer>
                {({viewId, setTitle}) => React.createElement(DynamicViewsDetailed[object.type['unigraph.id']].view, {
            data: isObjectStub ? loadedObj : object, callbacks: {viewId, setTitle, ...(callbacks ? callbacks : {})}, options: {viewId, setTitle, ...options || {}}, context, ...(attributes ? attributes : {})
        })}
            </TabContext.Consumer>
        </ErrorBoundary>;
    } else if (useFallback) {
        return (object && ((isObjectStub && loadedObj) || !isObjectStub)) ? <ObjectEditor uid={object?.uid} /> : <React.Fragment />
    } else return <React.Fragment/>
}