import React from 'react';
import ReactPlayer from 'react-player';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { buildGraph, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { byElementIndex, unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Sugar from 'sugar';
import stringify from 'json-stable-stringify';
import { DynamicViewRenderer } from '../../global.d';
import { getComponentFromExecutable } from '../../unigraph-react';
import { AutoDynamicView } from './AutoDynamicView';
import { AutoDynamicViewDetailed } from './AutoDynamicViewDetailed';
import { DynamicObjectListView } from './DynamicObjectListView';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { BacklinkView } from './BacklinkView';
import { isSmallScreen, TabContext, htmlDecode } from '../../utils';
import { setSearchPopup } from '../../examples/notes/searchPopup';

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
    isSmallScreen,
    setSearchPopup,
    ReactPlayer,
    ImageGallery,
    htmlDecode,
};

export const DynamicComponentView: DynamicViewRenderer = ({ data, callbacks }) => {
    const [previewComponent, setPreviewComponent] = React.useState<any>('Loading...');

    React.useEffect(() => {
        getComponentFromExecutable(data, callbacks?.props || {}, globalImports).then((comp: any) => {
            if (comp) setPreviewComponent(React.createElement(comp, callbacks?.props || {}, []));
        });
    }, [data?._updatedAt, stringify(callbacks?.props)]);

    return previewComponent;
};

export const getComponentAsView = async (view: any, params: any) => {
    const ret = await getComponentFromExecutable(view, params || {}, globalImports);
    if (typeof ret === 'function') {
        return ret;
    }
    return undefined;
};
