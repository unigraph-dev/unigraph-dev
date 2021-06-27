import { Typography } from "@material-ui/core"
import Sugar from "sugar"
import React from "react"

export const WidgetCurrentTime = () => {
    const [currentTime, setCurrentTime] = React.useState(new Date())
    React.useMemo(() => setInterval(() => setCurrentTime(new Date()), 1000), [])

    return <div style={{height: "120px"}}>
        <Typography variant={"h2"}>{Sugar.Date.format(currentTime, '{hh}:{mm}:{ss}')}</Typography>
        <Typography variant={"h6"}>{Sugar.Date.medium(currentTime)}</Typography>
    </div>
}