import React from "react";
import { useEffectOnce } from "react-use";
import { DynamicViewRenderer } from "../../global"

export const DynamicComponentView: DynamicViewRenderer = ({data, callbacks}) => {
    const [previewComponent, setPreviewComponent] = React.useState<any>("Loading...");

    useEffectOnce(() => {
        window.unigraph.runExecutable(data['unigraph.id'] || data.uid, {})
            .then((comp: any) => setPreviewComponent(React.createElement(comp, {}, [])))
    });

    return previewComponent
}