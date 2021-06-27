import { pages } from "../../App"
import { UnigraphWidget } from "../../components/UnigraphCore/UnigraphWidget"
import { WidgetCurrentTime } from "./WidgetCurrentTime"
import { WidgetPomodoro } from "./WidgetPomodoro"

export const TodayView = () => {
    return <div style={{display: "flex"}}>
        <div style={{width: "33%", padding: "8px 16px 16px 8px"}}>
            <UnigraphWidget><WidgetCurrentTime/></UnigraphWidget>
            <div style={{height: "16px"}}></div>
            <UnigraphWidget><WidgetPomodoro/></UnigraphWidget>
        </div>
        <div style={{flexGrow: 1}}>
            {pages['inbox'].constructor()}
            {pages['current-events'].constructor()}
        </div>
    </div>
}