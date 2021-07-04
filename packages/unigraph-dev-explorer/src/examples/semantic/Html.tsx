import { SizeMe } from "react-sizeme"
import { DynamicViewRenderer } from "../../global"

export const Html: DynamicViewRenderer = ({data, callbacks}) => {
    return <SizeMe>{({size}) => <div style={{width: "100%"}}>
        <iframe srcDoc={data['_value.%']} style={{height: size.height || "800px", width: size.width || "600px"}}/>
    </div>}</SizeMe>
}