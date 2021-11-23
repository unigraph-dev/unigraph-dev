import React from "react";
import { useEffectOnce } from "react-use";
import { DynamicViewRenderer } from "../../global"
import { getComponentFromExecutable } from "../../unigraph-react";
import { buildGraph, getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicView } from "./AutoDynamicView";
import { AutoDynamicViewDetailed } from "./AutoDynamicViewDetailed";

export const globalImports = {
    "HelloWorld": () => <p>Hello world!!!</p>,
    "AutoDynamicView": (props: any) => <AutoDynamicView {...props} />,
    "AutoDynamicViewDetailed": (props: any) => <AutoDynamicViewDetailed {...props} />,
    "UnigraphObject": UnigraphObject,
    "buildGraph": buildGraph
}

export const DynamicComponentView: DynamicViewRenderer = ({data, callbacks}) => {
    const [previewComponent, setPreviewComponent] = React.useState<any>("Loading...");

    useEffectOnce(() => {
        getComponentFromExecutable(data, callbacks?.props || {}, globalImports)
            .then((comp: any) => setPreviewComponent(React.createElement(comp, callbacks?.props || {}, [])))
    });

    return previewComponent
}

export const getComponentAsView = async (view: any, params: any) => {
    const ret = await getComponentFromExecutable(view, params || {}, globalImports);
    if (typeof ret === "function") {
        const tempViewId = "/temp/" + getRandomInt().toString();
        window.unigraph.addState(tempViewId, {
            component: ret,
            params: params
        });
        return tempViewId;
    }
}