import { pages } from "../../App"
import { UnigraphWidget } from "../../components/UnigraphCore/UnigraphWidget"
import { WidgetCurrentTime } from "./WidgetCurrentTime"
import { WidgetFocus } from "./WidgetFocus"
import { WidgetPomodoro } from "./WidgetPomodoro"

export const TodayView = ({pageName}: any) => {
    console.log(pageName)
    return <div style={{display: "flex", height: "100%"}}>
        <div style={{width: pageName ? "" : "33%", padding: "8px 16px 16px 8px", display: "flex", height: "100%", flexDirection: "column"}}>
            <UnigraphWidget style={{flex: 1}}><WidgetCurrentTime/></UnigraphWidget>
            <div style={{height: "16px"}}></div>
            <UnigraphWidget style={{flex: 1}}><WidgetPomodoro/></UnigraphWidget>
            <div style={{height: "16px"}}></div>
            <UnigraphWidget style={{flex: 1}}><WidgetFocus/></UnigraphWidget>
        </div>
        {pageName ? [] : <div style={{flexGrow: 1, display: "flex", flexDirection: "column"}}>
            <div style={{flex: 1}}>{pages['inbox'].constructor()}</div>
            <div style={{flex: 1}}>{pages['current-events'].constructor()}</div>
        </div>}
    </div>
}