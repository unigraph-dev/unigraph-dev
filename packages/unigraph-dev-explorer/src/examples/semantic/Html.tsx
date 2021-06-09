import React from "react"
import { SizeMe } from "react-sizeme"
import { registerDetailedDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react"
import { DynamicViewRenderer } from "../../global"

export const Html: DynamicViewRenderer = ({data, callbacks}) => {
    return <SizeMe>{({size}) => <div>
        <iframe srcDoc={data['_value.%']} style={{height: size.height || "800px", width: size.width || "600px"}}/>
    </div>}</SizeMe>
}

export const init = () => {
    registerDetailedDynamicViews({"$/schema/html": Html})
}