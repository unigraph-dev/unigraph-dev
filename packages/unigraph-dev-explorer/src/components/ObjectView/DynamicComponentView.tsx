import React from "react";
import { useEffectOnce } from "react-use";
import { DynamicViewRenderer } from "../../global"
import { getComponentFromExecutable } from "unigraph-dev-common/lib/api/unigraph-react";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";

export const DynamicComponentView: DynamicViewRenderer = ({data, callbacks}) => {
    const [previewComponent, setPreviewComponent] = React.useState<any>("Loading...");

    useEffectOnce(() => {
        getComponentFromExecutable(data, callbacks?.props || {})
            .then((comp: any) => setPreviewComponent(React.createElement(comp, callbacks?.props || {}, [])))
    });

    return previewComponent
}

export const getComponentAsView = async (view: any, params: any) => {
    const ret = await getComponentFromExecutable(view, params || {});
    if (typeof ret === "function") {
        const tempViewId = "/temp/" + getRandomInt().toString();
        window.unigraph.addState(tempViewId, {
            component: ret,
            params: params
        });
        return tempViewId;
    }
}