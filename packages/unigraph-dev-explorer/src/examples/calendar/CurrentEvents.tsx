import { ListItem, Typography } from "@material-ui/core";
import React from "react"
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";

export const CurrentEvents = () => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [currentEvents, setCurrentEvents] = React.useState([]);

    React.useEffect(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToQuery("$/executable/get-current-events", (res: any) => {
            setCurrentEvents(res);
            setCurrentDate(new Date());
        }, id, true);

        return function cleanup() { window.unigraph.unsubscribe(id); }

    }, [])

    return <div>
        <Typography>It's currently {currentDate.toString()}!</Typography>
        <Typography>Showing all events before this time:</Typography>
        {currentEvents?.length ? <DefaultObjectListView objects={currentEvents} component={ListItem}/> : "Absolutely nothing"}
    </div>
}