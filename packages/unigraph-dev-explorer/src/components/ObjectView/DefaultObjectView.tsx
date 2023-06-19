import { IconButton } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import React, { FC } from 'react';

import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicViewRenderer } from '../../global.d';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { AutoDynamicView } from './AutoDynamicView';
import { AutoDynamicViewDetailed } from './AutoDynamicViewDetailed';
import { JsontreeObjectViewer, StringObjectViewer } from './BasicObjectViews';
import { useDetailedObjNameTab } from '../UnigraphCore/useEntityNameTab';

const getProps = (data: UnigraphObject) => {
    try {
        return JSON.parse(data?.get('props')?.as('primitive'))?.props || {};
    } catch (e) {
        return {};
    }
};

export const ViewViewDetailed: DynamicViewRenderer = ({ data, callbacks }) => {
    if (data.get('view')?._value?.['dgraph.type'].includes('Executable')) {
        return (
            <AutoDynamicViewDetailed
                object={{
                    uid: data.get('view')._value.uid,
                    _stub: 1,
                    type: data.get('view')._value.type,
                }}
                callbacks={callbacks}
            />
        );
    }
    if (data.get('view').as('primitive')?.startsWith?.('/pages')) {
        const pages = window.unigraph.getState('registry/pages').value;
        return pages[data.get('view').as('primitive').replace('/pages/', '')].constructor({
            ...JSON.parse(data.get('props').as('primitive')).config,
            callbacks: { ...callbacks, props: getProps(data) },
        });
    }
    const widgets = window.unigraph.getState('registry/widgets').value;
    return widgets[data.get('view').as('primitive').replace('/widgets/', '')].constructor();
};

const DefaultObjectView: FC<DefaultObjectViewProps> = ({ object, options, callbacks }) => {
    // const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const [ContextMenu, setContextMenu] = React.useState<any>(null);

    if (!object) return <div />;

    const finalObject = options.unpad ? unpad(object) : object;
    let FinalObjectViewer;
    const ContextMenuButton: any = null;

    switch (options.viewer) {
        case 'dynamic-view':
            FinalObjectViewer = (
                <AutoDynamicView object={object} options={{ allowSubentity: true }} callbacks={callbacks} />
            );
            break;

        case 'dynamic-view-detailed':
            FinalObjectViewer = <AutoDynamicViewDetailed object={object} options={options} callbacks={callbacks} />;
            break;

        case 'json-tree':
            FinalObjectViewer = <JsontreeObjectViewer object={object} options={options} />;
            break;

        case 'code-editor':
            FinalObjectViewer = <ExecutableCodeEditor object={object} />;
            break;

        default:
            FinalObjectViewer = <StringObjectViewer object={finalObject} />;
            break;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
            {ContextMenuButton} {ContextMenu}
            <div
                style={{
                    alignSelf: 'center',
                    width: '100%',
                    alignItems: 'center',
                    display: 'flex',
                    flexFlow: 'wrap',
                }}
            >
                {FinalObjectViewer}
            </div>
        </div>
    );
};

export { DefaultObjectView };
