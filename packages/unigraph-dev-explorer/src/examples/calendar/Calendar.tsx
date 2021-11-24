import { Avatar, Badge, Typography } from "@material-ui/core";
import { CalendarToday } from "@material-ui/icons";
import React from "react";
import { buildGraph, getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/utils/utils";
import { DynamicObjectListView } from "../../components/ObjectView/DynamicObjectListView";
import Sugar from 'sugar';
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";

export const CalendarEvent = ({data, callbacks}: any) => {
    return <div style={{display: "flex"}}>
        <div style={{alignSelf: "center", marginRight: "16px"}}>
            <Avatar
                style={{ width: 16, height: 16, backgroundColor: data.get('calendar/color').as('primitive') }}
            >{" "}</Avatar>
        </div>
        
        <div>
            <div style={{display: "flex", alignItems: "center"}}>
                <Typography variant="body1" style={{marginRight: "8px"}}><strong>{data.get('name').as("primitive")}</strong></Typography>
                <Typography variant="body2" style={{color: "gray"}}>{data.get('location').as("primitive")}</Typography>
            </div>
            <AutoDynamicView object={new UnigraphObject(data.get('time_frame')['_value'])} callbacks={callbacks} noDrag noDrop />
        </div>
    </div>
}

export const TimeFrame = ({data, callbacks}: any) => {
    return <span>
        {callbacks?.noDate ? "" : (Sugar.Date.medium(new Date(data.get('start/datetime').as('primitive'))) + ", ")}
        {Sugar.Date.format(new Date(data.get('start/datetime').as('primitive')), "{h}:{mm}%P") + " - "}
        {Sugar.Date.format(new Date(data.get('end/datetime').as('primitive')), "{h}:{mm}%P")}
    </span>
}

export const Calendar = () => {
    const [currentEvents, setCurrentEvents] = React.useState<any>([]);

    React.useEffect(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToType("$/schema/calendar_event", (res: any) => {
            setCurrentEvents(res.reverse());
        }, id, {uidsOnly: true});

        return function cleanup() { window.unigraph.unsubscribe(id); }

    }, [])

    return <DynamicObjectListView 
        items={currentEvents}
        context={null}
    />
}