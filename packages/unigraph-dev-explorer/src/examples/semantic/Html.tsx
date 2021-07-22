import React from "react";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView"
import { DynamicViewRenderer } from "../../global"

export const Html: DynamicViewRenderer = ({data, context, callbacks}) => {
    const frm = React.useRef(null);

    return <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
        {context ? <AutoDynamicView object={context} /> : []}
        <iframe srcDoc={data['_value.%']} style={{flexGrow: 1, width: "100%"}} ref={frm} onLoad={() => {
            console.log(frm.current);
            (frm.current as any).contentDocument.head.insertAdjacentHTML("beforeend", "<style>img{ width: 100%; height: auto } video{ width: 100%; height: auto }</style>");
        }}/>
    </div>
}