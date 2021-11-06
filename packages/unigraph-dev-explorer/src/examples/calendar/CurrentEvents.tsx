import { Typography } from "@material-ui/core";
import React from "react"
import { buildGraph, getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { DynamicObjectListView } from "../../components/ObjectView/DynamicObjectListView";

export const CurrentEvents = () => {
    const [currentEvents, setCurrentEvents] = React.useState<any>([]);

    React.useEffect(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToQuery("$/executable/get-next-events", (res: any) => {
            setCurrentEvents(buildGraph(res as any[]));
        }, id, true);

        return function cleanup() { window.unigraph.unsubscribe(id); }

    }, [])

    return <DynamicObjectListView 
        items={currentEvents}
        context={null}
    />
}