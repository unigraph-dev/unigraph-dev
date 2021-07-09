import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView"
import { DynamicViewRenderer } from "../../global"

export const Html: DynamicViewRenderer = ({data, context, callbacks}) => {
    return <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
        {context ? <AutoDynamicView object={context} /> : []}
        <iframe srcDoc={data['_value.%']} style={{flexGrow: 1, width: "100%"}}/>
    </div>
}