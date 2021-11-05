import { Typography } from "@material-ui/core";
import React from "react";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { DynamicObjectListView } from "../../components/ObjectView/DynamicObjectListView";

export const CalendarEvent = ({data}: any) => {
    return `Name: ${data.get('name').as('primitive')}`
}

export const Calendar = () => {
    const [currentEvents, setCurrentEvents] = React.useState<any>([]);

    React.useEffect(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToType("$/schema/calendar_event", (res: any) => {
            setCurrentEvents(res);
        }, id);

        return function cleanup() { window.unigraph.unsubscribe(id); }

    }, [])

    return <div>
        <Typography gutterBottom>Current Items</Typography>
        <DynamicObjectListView 
            items={currentEvents}
            context={null}
        />
    </div>
}