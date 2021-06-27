import { Typography } from "@material-ui/core"
import React from "react"

export const WidgetCurrentTime = () => {
    const [currentTime, setCurrentTime] = React.useState(new Date())
    React.useMemo(() => setInterval(() => setCurrentTime(new Date()), 1000), [])

    return <div style={{height: "120px"}}>
        <Typography>{currentTime.toString()}</Typography>
    </div>
}