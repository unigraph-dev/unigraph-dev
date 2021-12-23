import React from "react";
import { useEffectOnce } from "react-use";
import { DynamicViewRenderer } from "../../global"
import { getComponentFromExecutable } from "../../unigraph-react";
import { buildGraph, getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/utils/utils";
import { AutoDynamicView } from "./AutoDynamicView";
import { AutoDynamicViewDetailed } from "./AutoDynamicViewDetailed";
import { DynamicObjectListView } from "./DynamicObjectListView";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { onUnigraphContextMenu } from "./DefaultObjectContextMenu";
import { BacklinkView } from "./BacklinkView";
import Sugar from 'sugar';

export const globalImports = {
    "HelloWorld": () => <p>Hello world!!!</p>,
    "AutoDynamicView": (props: any) => <AutoDynamicView {...props} />,
    "AutoDynamicViewDetailed": (props: any) => <AutoDynamicViewDetailed {...props} />,
    "DynamicObjectListView": (props: any) => <DynamicObjectListView {...props} />,
    "UnigraphObject": UnigraphObject,
    "buildGraph": buildGraph,
    "unpad": unpad,
    "getRandomInt": getRandomInt,
    "byElementIndex": byElementIndex,
    "onUnigraphContextMenu": onUnigraphContextMenu,
    "BacklinkView": BacklinkView,
    "Sugar": Sugar,
}

export const DynamicComponentView: DynamicViewRenderer = ({data, callbacks}) => {
    const [previewComponent, setPreviewComponent] = React.useState<any>("Loading...");

    React.useEffect(() => {
        getComponentFromExecutable(data, callbacks?.props || {}, globalImports)
            .then((comp: any) => setPreviewComponent(React.createElement(comp, callbacks?.props || {}, [])))
    }, [data]);

    return previewComponent
}

export const getComponentAsView = async (view: any, params: any) => {
    const ret = await getComponentFromExecutable(view, params || {}, globalImports);
    if (typeof ret === "function") {
        return ret;
    }
}