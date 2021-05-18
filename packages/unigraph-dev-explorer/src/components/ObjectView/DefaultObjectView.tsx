import { Button, ButtonGroup, Checkbox, FormControlLabel, IconButton, List, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { MoreVert, PlayArrow } from '@material-ui/icons';
import React, { FC, ReactElement } from 'react';
import ReactJson, { InteractionProps } from 'react-json-view';
import { useEffectOnce } from 'react-use';
import { prepareExportObjects, unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global';
import { download } from '../../utils';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { defaultContextMenu, DefaultObjectContextMenu } from './DefaultObjectContextMenu';
import { filterPresets } from './objectViewFilters';

type ObjectViewOptions = {
    viewer?: "string" | "json-tree" | "dynamic-view" | "code-editor" | "dynamic-view-detailed",
    unpad?: boolean,
    canEdit?: boolean,
    showContextMenu?: boolean,
};

type ObjectListViewOptions = {
    filters?: {
        showDeleted?: boolean,
        showNoView?: boolean,
    },
}

type DefaultObjectViewProps = {
    object: any,
    options: ObjectViewOptions,
};

type DefaultObjectListViewProps = {
    component: (...args: any[]) => ReactElement<any, any>,
    objects: any[],
    options?: ObjectListViewOptions,
};

const StringObjectViewer = ({object}: {object: any}) => {
    const finalObject = unpad(object)

    return <div>
        Type: {object?.type?.["unigraph.id"]}<br/>
        {JSON.stringify(finalObject, null, 2)}
    </div>;
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

const JsontreeObjectViewer = ({object, options}: {object: any, options: ObjectViewOptions}) => {

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
        <ReactJson src={showPadded ? object : unpad(object)} onEdit={options.canEdit ? onedit : false} onAdd={options.canEdit ? onedit : false} />
    </div>
}

const Executable: DynamicViewRenderer = ({data, callbacks}) => {
    const unpadded = unpad(data);

    return <React.Fragment>
        <ListItemIcon style={{paddingLeft: "8px"}} onClick={() => {window.unigraph.runExecutable(unpadded['unigraph.id'], {})}}><PlayArrow/></ListItemIcon>
        <ListItemText primary={"Run code: " + unpadded.name} secondary={`Environment: ${unpadded.env}`} />
    </React.Fragment>
}


const DynamicViews: Record<string, DynamicViewRenderer> = {
    "$/schema/executable": Executable
}

window.DynamicViews = DynamicViews;

const DynamicViewsDetailed: Record<string, DynamicViewRenderer> = {
    "$/schema/executable": ExecutableCodeEditor
}

window.DynamicViewsDetailed = DynamicViews;

export const AutoDynamicView: DynamicViewRenderer = ({ object, callbacks }) => {

    const domEl = React.useRef(null);
    // @ts-ignore
    window.pp = domEl;

    useEffectOnce(() => {
        // @ts-expect-error: 
        domEl.current.addEventListener('contextmenu', (event: any) => {
            event.preventDefault();
            window.unigraph.getState('global/contextMenu').setValue({
                anchorPosition: {top: event.y, left: event.x},
                menuContent: defaultContextMenu,
                contextObject: object,
                contextUid: object?.uid,
                show: true
            })
        })
    })

    //console.log(object)
    let el;
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViews).includes(object.type['unigraph.id'])) {
        el = React.createElement(DynamicViews[object.type['unigraph.id']], {
            data: object, callbacks: callbacks ? callbacks : undefined
        });
    } else {
        el = <StringObjectViewer object={object}/>
    }
    return <div id={"object-view-"+object?.uid} style={{display: "contents"}} ref={domEl}>
        {el}
    </div>;
}

export const AutoDynamicViewDetailed: DynamicViewRenderer = ({ object, options, callbacks }) => {
    //console.log(object)
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViewsDetailed).includes(object.type['unigraph.id'])) {
        return React.createElement(DynamicViewsDetailed[object.type['unigraph.id']], {
            data: object, callbacks: callbacks ? callbacks : undefined
        });
    } else {
        return <JsontreeObjectViewer object={object} options={options}/>
    }
}

const DefaultObjectView: FC<DefaultObjectViewProps> = ({ object, options }) => {
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
            FinalObjectViewer = <AutoDynamicView object={object} />;
            break;

        case "dynamic-view-detailed":
            FinalObjectViewer = <AutoDynamicViewDetailed object={object} options={options}/>;
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
                display: "flex"}}>{FinalObjectViewer}</div>
    </div>
}

const DefaultObjectList: FC<DefaultObjectListViewProps> = ({component, objects, options}) => {
    let finalObjects = objects;
    if (!options?.filters?.showDeleted) finalObjects = filterPresets['no-deleted'](finalObjects);
    if (!options?.filters?.showNoView) finalObjects = filterPresets['no-noview'](finalObjects, DynamicViews);

    return <div>{finalObjects.map(obj => React.createElement(
        component, {}, 
        [<DefaultObjectView object={obj} 
            options={{
                unpad: false, 
                showContextMenu: true,
                viewer: "dynamic-view",
            }} />]))}</div>
}

const DefaultObjectListView: FC<DefaultObjectListViewProps> = ({component, objects}) => {

    const [showDeleted, setShowDeleted] = React.useState(false);
    const [showNoView, setShowNoView] = React.useState(false);

    return <div>
        <ButtonGroup color="primary" aria-label="outlined primary button group">
            <Button onClick={() => {download(`export_unigraph_${new Date().toISOString()}.json`, JSON.stringify(prepareExportObjects(objects)))}}>Export All</Button>
            <Button>Export Selected</Button>
            <Button>Select All</Button>
        </ButtonGroup>
        <FormControlLabel control={<Checkbox
            checked={showDeleted}
            onChange={() => setShowDeleted(!showDeleted)}
            name="showDeleted"
            color="primary"
        />} label="Show Deleted"/>
        <FormControlLabel control={<Checkbox
            checked={showNoView}
            onChange={() => setShowNoView(!showNoView)}
            name="showNoView"
            color="primary"
        />} label="Show Objects without a View"/>
        <List>
            <DefaultObjectList 
                component={component}
                objects={objects}
                options={{filters: {showDeleted: showDeleted, showNoView: showNoView}}}
            />
        </List>
    </div>

}

export { DefaultObjectView, DefaultObjectList, DefaultObjectListView, DynamicViews, DynamicViewsDetailed };