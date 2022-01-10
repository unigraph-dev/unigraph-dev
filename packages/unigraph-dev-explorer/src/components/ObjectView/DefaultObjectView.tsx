import { IconButton } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import React, { FC } from 'react';

import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { DynamicViewRenderer } from '../../global.d';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { DefaultObjectContextMenu } from './DefaultObjectContextMenu';
import { AutoDynamicView } from './AutoDynamicView';
import { AutoDynamicViewDetailed } from './AutoDynamicViewDetailed';
import { JsontreeObjectViewer, StringObjectViewer } from './BasicObjectViews';

export const ViewViewDetailed: DynamicViewRenderer = ({ data, callbacks }) => {
    if (data.get('view')?._value?.['dgraph.type'].includes('Executable')) {
        return <AutoDynamicViewDetailed object={new UnigraphObject(data.get('view')._value)} callbacks={callbacks} />;
    }
    if (data.get('view').as('primitive')?.startsWith?.('/pages')) {
        const pages = window.unigraph.getState('registry/pages').value;
        return pages[data.get('view').as('primitive').replace('/pages/', '')].constructor({
            ...JSON.parse(data.get('props').as('primitive')).config,
            callbacks,
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
    const ContextMenuButton: any = options.showContextMenu ? (
        <IconButton
            aria-label="context-menu"
            onClick={(ev) => {
                setContextMenu(
                    <DefaultObjectContextMenu
                        uid={object.uid}
                        object={object}
                        anchorEl={ev.currentTarget}
                        handleClose={() => {
                            setContextMenu(null);
                        }}
                    />,
                );
            }}
        >
            <MoreVert />
        </IconButton>
    ) : null;

    switch (options.viewer) {
        case 'dynamic-view':
            FinalObjectViewer = <AutoDynamicView object={object} allowSubentity callbacks={callbacks} />;
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
