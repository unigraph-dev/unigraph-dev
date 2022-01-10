import React from 'react';
import { buildGraph, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { byElementIndex, unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Sugar from 'sugar';
import { DynamicViewRenderer } from '../../global.d';
import { getComponentFromExecutable } from '../../unigraph-react';
import { AutoDynamicView } from './AutoDynamicView';
import { AutoDynamicViewDetailed } from './AutoDynamicViewDetailed';
import { DynamicObjectListView } from './DynamicObjectListView';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { BacklinkView } from './BacklinkView';
import { TabContext } from '../../utils';

export const globalImports = {
    HelloWorld: () => <p>Hello world!!!</p>,
    AutoDynamicView: (props: any) => <AutoDynamicView {...props} />,
    AutoDynamicViewDetailed: (props: any) => <AutoDynamicViewDetailed {...props} />,
    DynamicObjectListView: (props: any) => <DynamicObjectListView {...props} />,
    UnigraphObject,
    buildGraph,
    unpad,
    getRandomInt,
    byElementIndex,
    onUnigraphContextMenu,
    BacklinkView,
    Sugar,
    TabContext,
};

export const DynamicComponentView: DynamicViewRenderer = ({ data, callbacks }) => {
    const [previewComponent, setPreviewComponent] = React.useState<any>('Loading...');

    React.useEffect(() => {
        getComponentFromExecutable(data, callbacks?.props || {}, globalImports).then((comp: any) => {
            if (comp) setPreviewComponent(React.createElement(comp, callbacks?.props || {}, []));
        });
    }, [data]);

    return previewComponent;
};

export const getComponentAsView = async (view: any, params: any) => {
    const ret = await getComponentFromExecutable(view, params || {}, globalImports);
    if (typeof ret === 'function') {
        return ret;
    }
    return undefined;
};
