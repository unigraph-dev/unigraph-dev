import { Checkbox, FormControlLabel, IconButton, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { MoreVert, OpenInNew, PlayArrow, TrendingFlat } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import React, { FC } from 'react';
import ReactJson, { InteractionProps } from 'react-json-view';

import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { DefaultObjectContextMenu } from './DefaultObjectContextMenu';
import { DynamicComponentView, getComponentAsView } from './DynamicComponentView';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicView } from './AutoDynamicView';
import { AutoDynamicViewDetailed } from './AutoDynamicViewDetailed';

type ObjectViewOptions = {
    viewer?: "string" | "json-tree" | "dynamic-view" | "code-editor" | "dynamic-view-detailed",
    unpad?: boolean,
    canEdit?: boolean,
    showContextMenu?: boolean,
    viewId?: any
};

type DefaultObjectViewProps = {
    object: any,
    options: ObjectViewOptions,
    callbacks?: Record<string, any>
};

export const StringObjectViewer = ({object}: {object: any}) => {
    const finalObject = unpad(object)

    return <div style={{maxHeight: "160px", width: "100%", overflowX: "auto"}}>
        Type: {object?.type?.["unigraph.id"]}<br/>
        {JSON.stringify(finalObject, null, 2)}
    </div>;
}

export const DefaultSkeleton = () => {
    return <div style={{width: "100%"}}><Skeleton /> <Skeleton /> <Skeleton /></div>
}

const onPropertyEdit = (edit: InteractionProps, pad: boolean) => { 
    //console.log(edit);
    let refUpdateHost: any = edit.existing_src;
    edit.namespace.forEach(el => {
        if (typeof el === "string") refUpdateHost = refUpdateHost[el]; 
        else {throw new Error("Doesn't support deletion")}
    });
    if (refUpdateHost?.uid && typeof edit.name === "string") {
        let updater: any = {};
        updater[edit.name] = edit.new_value;
        window.unigraph.updateObject(refUpdateHost.uid, updater, true, pad)
    }
}

export const JsontreeObjectViewer = ({object, options}: {object: any, options: ObjectViewOptions}) => {

    const [showPadded, setShowPadded] = React.useState(false);
    const onedit = (props: InteractionProps) => onPropertyEdit(props, !showPadded);

    return <div>
        <Typography variant="h5">Object View</Typography>
        <FormControlLabel control={<Checkbox
            checked={showPadded}
            onChange={() => setShowPadded(!showPadded)}
            name="showPadded"
            color="primary"
        />} label="Show object as padded"/>
        {JSON.stringify(options)}
        <ReactJson src={showPadded ? object : unpad(object)} onEdit={(options.canEdit && showPadded) ? onedit : false} onAdd={(options.canEdit && showPadded) ? onedit : false} />
    </div>
}

export const Executable: DynamicViewRenderer = ({data, callbacks}) => {
    const unpadded = unpad(data);
    const icons: any = {
        "routine/js": <PlayArrow/>,
        "component/react-jsx": <OpenInNew/>,
        "lambda/js": <TrendingFlat/>
    }
    const actions: any = {
        "routine/js": () => {window.unigraph.runExecutable(unpadded['unigraph.id'] || data.uid, {})},
        "component/react-jsx": () => {
            // Open in new
            getComponentAsView(data, {}).then((viewId: any) => {
                window.newTab(window.layoutModel, {
                    type: "tab",
                    name: "Component view",
                    component: viewId,
                    enableFloat: "true",
                    config: {}
                })
            })
        },
        "lambda/js": async () => {
            const res = await window.unigraph.runExecutable(unpadded['unigraph.id'] || data.uid, {});
            console.log(res);
        }
    }

    return <React.Fragment>
        <ListItemIcon style={{paddingLeft: "8px"}} onClick={actions[unpadded.env]}>{icons[unpadded.env]}</ListItemIcon>
        <ListItemText primary={"Run code: " + unpadded.name} secondary={`Environment: ${unpadded.env}`} />
    </React.Fragment>
}

export const CodeOrComponentView = (props: any) => {
    if (props.data.get('env').as('primitive') === "component/react-jsx") {
        return <DynamicComponentView {...props} />
    } else {
        return <ExecutableCodeEditor {...props} />
    }
}

export const ViewViewDetailed: DynamicViewRenderer = ({data, callbacks}) => {
    if (data.get('view')?.['_value']?.['dgraph.type'].includes('Executable')) {
        return <AutoDynamicViewDetailed object={new UnigraphObject(data.get('view')['_value'])} callbacks={callbacks} />
    } else {
        if (data.get('view').as('primitive')?.startsWith?.('/pages')) {
            const pages = window.unigraph.getState('registry/pages').value;
            return pages[data.get('view').as('primitive').replace('/pages/', '')]
                .constructor({...JSON.parse(data.get('props').as('primitive')).config, callbacks: callbacks})
        } else {
            const widgets = window.unigraph.getState('registry/widgets').value;
            return widgets[data.get('view').as('primitive').replace('/widgets/', '')]
                .constructor()
        }
    }
}

const DefaultObjectView: FC<DefaultObjectViewProps> = ({ object, options, callbacks }) => {
    //const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const [ContextMenu, setContextMenu] = React.useState<any>(null);

    if (!object) return <div/>

    const finalObject = options.unpad ? unpad(object) : object
    let FinalObjectViewer;
    const ContextMenuButton: any = options.showContextMenu ? <IconButton 
        aria-label="context-menu"
        onClick={(ev) => {
            setContextMenu(<DefaultObjectContextMenu 
                uid={object.uid}
                object={object} 
                anchorEl={ev.currentTarget} 
                handleClose={()=>{setContextMenu(null)}}/>)
        }}
    >
        <MoreVert />
    </IconButton> : null
    

    switch (options.viewer) {
        case "dynamic-view":
            FinalObjectViewer = <AutoDynamicView object={object} allowSubentity callbacks={callbacks}/>;
            break;

        case "dynamic-view-detailed":
            FinalObjectViewer = <AutoDynamicViewDetailed object={object} options={options} callbacks={callbacks}/>;
            break;

        case "json-tree":
            FinalObjectViewer = <JsontreeObjectViewer object={object} options={options}/>;
            break;

        case "code-editor":
            FinalObjectViewer = <ExecutableCodeEditor object={object} />;
            break;
    
        default:
            FinalObjectViewer = <StringObjectViewer object={finalObject}/>;
            break;
    }

    return <div style={{display: "flex", flexDirection: "row", width: "100%"}}>
        {ContextMenuButton} {ContextMenu}
        <div style={{alignSelf: "center",width: "100%",
                alignItems: "center",
                display: "flex", flexFlow: "wrap"}}>{FinalObjectViewer}</div>
    </div>
}

export { DefaultObjectView };