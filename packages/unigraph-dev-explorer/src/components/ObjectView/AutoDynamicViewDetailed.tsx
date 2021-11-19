import { Typography } from "@material-ui/core";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { DynamicViewRenderer } from "../../global";
import { JsontreeObjectViewer } from "./DefaultObjectView";
import { isStub } from "./utils";

export const AutoDynamicViewDetailed: DynamicViewRenderer = ({ object, options, callbacks, context, component, attributes, useFallback }) => {

    const isObjectStub = isStub(object)
    const [loadedObj, setLoadedObj] = React.useState<any>(false)
    const [subsId, setSubsId] = React.useState(getRandomInt());

    const DynamicViewsDetailed = {...window.unigraph.getState('registry/dynamicViewDetailed').value, ...(component || {})}

    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub) {
            window.unigraph.unsubscribe(subsId);
            const query = DynamicViewsDetailed[object.type['unigraph.id']].query(object.uid)
            window.unigraph.subscribeToQuery(query, (objects: any[]) => {
                setLoadedObj(objects[0]);
            }, newSubs, true);
            setSubsId(newSubs);
        }

        return function cleanup () { window.unigraph.unsubscribe(newSubs); }
    }, [object])

    if (isObjectStub) callbacks = {...callbacks, subsId}
    
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViewsDetailed).includes(object.type['unigraph.id']) && ((isObjectStub && loadedObj) || !isObjectStub)) {
        return <ErrorBoundary FallbackComponent={(error) => <div>
            <Typography>Error in detailed AutoDynamicView: </Typography>
            <p>{JSON.stringify(error, null, 4)}</p>
        </div>}>
            {React.createElement(DynamicViewsDetailed[object.type['unigraph.id']].view, {
            data: isObjectStub ? loadedObj : object, callbacks, options: options || {}, context, ...(attributes ? attributes : {})
        })}
        </ErrorBoundary>;
    } else if (useFallback) {
        return <JsontreeObjectViewer object={isObjectStub ? loadedObj : object} options={options}/>
    } else return <React.Fragment/>
}