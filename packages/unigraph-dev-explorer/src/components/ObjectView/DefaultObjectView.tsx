import { Button, ButtonGroup, Checkbox, FormControlLabel, IconButton, List, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { MoreVert, PlayArrow } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import React, { FC, ReactElement } from 'react';
import { useDrag, useDrop} from 'react-dnd';
import ReactJson, { InteractionProps } from 'react-json-view';
import { useEffectOnce } from 'react-use';
import { prepareExportObjects, unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global';
import { AutoDynamicViewProps } from '../../types/ObjectView';
import { download } from '../../utils';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { defaultContextContextMenu, defaultContextMenu, DefaultObjectContextMenu, onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { filterPresets } from './objectViewFilters';

type ObjectViewOptions = {
    viewer?: "string" | "json-tree" | "dynamic-view" | "code-editor" | "dynamic-view-detailed",
    unpad?: boolean,
    canEdit?: boolean,
    showContextMenu?: boolean,
    viewId?: any
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

const DefaultSkeleton = () => {
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
    "$/schema/executable": Executable,
    "$/skeleton/default": DefaultSkeleton,
}

window.DynamicViews = DynamicViews;

const DynamicViewsDetailed: Record<string, DynamicViewRenderer> = {
    "$/schema/executable": ExecutableCodeEditor,
}

window.DynamicViewsDetailed = DynamicViewsDetailed;

const SubentityDropAcceptor = ({ uid }: any) => {
    const [{ isOver, canDrop }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: {uid: string}, monitor) => {
          window.unigraph.updateObject(uid, {
              semantic_properties: {
                  children: [{
                      type: {"unigraph.id": "$/schema/subentity"},
                      uid: item.uid
                  }]
              }
          })
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        })
    }))

    const opacities: Record<string, number> = {"truetrue": 1, "truefalse": 0.5, "falsefalse": 0, "falsetrue": 0}

    return <div ref={dropSub} style={{opacity: opacities[canDrop + "" + isOver], width: "100%", height: canDrop ? "16px" : "0px", margin: "0px"}}>
        <hr style={{height: "50%", backgroundColor: "gray", margin: "0px", marginLeft: "48px"}}/>
    </div>
}

export const AutoDynamicView = ({ object, callbacks, component, attributes, inline, allowSubentity, style }: AutoDynamicViewProps) => {
    allowSubentity = allowSubentity === true;

    const [{ isDragging }, drag] = useDrag(() => ({
        type: object?.['type']?.['unigraph.id'] || "$/schema/any",
        item: {uid: object?.uid},
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging()
        })
    }))

    const [, drop] = useDrop(() => ({
          accept: window.unigraph.getState('referenceables/semantic_children').value,
          drop: (item: {uid: string}, monitor) => {
            window.unigraph.updateObject(object?.uid, {
                semantic_properties: {
                    children: [{
                        uid: item.uid
                    }]
                }
            })
          },
    }))

    const contextEntity = typeof callbacks?.context === "object" ? callbacks.context : null; 
    const [hasContextMenu, setHasContextMenu] = React.useState(false);
    const contextMenuState = window.unigraph.getState('global/contextMenu');
    contextMenuState.subscribe((menu: any) => {setHasContextMenu((menu.show && menu.contextUid === object.uid))})

    const attach = React.useCallback((domElement) => {
        drag(domElement);
        drop(domElement);
    }, [isDragging, drag, callbacks])

    //console.log(object) 
    let el;
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViews).includes(object.type['unigraph.id'])) {
        el = React.createElement(component?.[object.type['unigraph.id']] ? component[object.type['unigraph.id']] : DynamicViews[object.type['unigraph.id']], {
            data: object, callbacks: callbacks ? callbacks : undefined, ...(attributes ? attributes : {})
        });
    } else if (object) {
        el = <StringObjectViewer object={object}/>
    }
    return el ? <React.Fragment>
        <div 
            id={"object-view-"+object?.uid} 
            style={{
                backgroundColor: hasContextMenu ? "whitesmoke" : "unset",
                opacity: isDragging ? 0.5 : 1, 
                display: "inline-flex", alignItems: "center",
                ...(inline ? {} : {width: "100%"}),
                ...style
            }} 
            ref={attach} 
            onContextMenu={(event) => onUnigraphContextMenu(event, object, contextEntity, callbacks)}
            {...(attributes ? attributes : {})}
        >
            {el}
        </div>
        {allowSubentity ? <SubentityDropAcceptor uid={object?.uid} /> : []}
    </React.Fragment> : <React.Fragment/>;
}

export const AutoDynamicViewDetailed: DynamicViewRenderer = ({ object, options, callbacks }) => {
    //console.log(object)
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViewsDetailed).includes(object.type['unigraph.id'])) {
        return React.createElement(DynamicViewsDetailed[object.type['unigraph.id']], {
            data: object, callbacks: callbacks, options: options || {}
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
            FinalObjectViewer = <AutoDynamicView object={object} allowSubentity />;
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
                display: "flex", flexFlow: "wrap"}}>{FinalObjectViewer}</div>
    </div>
}

const DefaultObjectList: FC<DefaultObjectListViewProps> = ({component, objects, options}) => {
    let finalObjects = objects;
    if (!options?.filters?.showDeleted) finalObjects = filterPresets['no-deleted'](finalObjects);
    if (!options?.filters?.showNoView) finalObjects = filterPresets['no-noview'](finalObjects, DynamicViews);

    return <React.Fragment>
        {(finalObjects.length ? finalObjects : Array(10).fill({'type': {'unigraph.id': '$/skeleton/default'}})).map(obj => React.createElement(
            component, 
            {key: obj.uid}, 
            [<DefaultObjectView object={obj} 
                options={{
                    unpad: false, 
                    showContextMenu: true,
                    viewer: "dynamic-view",
                }} 
            />]
        ))}
    </React.Fragment>
}

/**
 * This one is deprecated and sucks a lot. Please don't use this one.
 * @param param0 
 * @returns 
 */
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