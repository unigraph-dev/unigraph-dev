import { Checkbox, FormControlLabel, IconButton, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { MoreVert, OpenInNew, PlayArrow } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import React, { FC } from 'react';
import { useDrag, useDrop} from 'react-dnd';
import ReactJson, { InteractionProps } from 'react-json-view';
import { useSwipeable } from 'react-swipeable';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global';
import { AutoDynamicViewProps } from '../../types/ObjectView';
import { isMobile, isMultiSelectKeyPressed, selectUid } from '../../utils';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { DefaultObjectContextMenu, onUnigraphContextMenu } from './DefaultObjectContextMenu';
import {ErrorBoundary} from 'react-error-boundary'
import { DynamicComponentView, getComponentAsView } from './DynamicComponentView';

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

const StringObjectViewer = ({object}: {object: any}) => {
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

export const Executable: DynamicViewRenderer = ({data, callbacks}) => {
    const unpadded = unpad(data);
    const icons: any = {
        "routine/js": <PlayArrow/>,
        "component/react-jsx": <OpenInNew/>
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

const SubentityDropAcceptor = ({ uid }: any) => {
    const [{ isOver, canDrop }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: {uid: string, itemType: string}, monitor) => {
            if (!monitor.didDrop()) {
                window.unigraph.updateObject(uid, {
                    children: [{
                        type: {"unigraph.id": "$/schema/subentity"},
                        _value: {
                            //"type": {"unigraph.id": item.itemType},
                            uid: item.uid
                        }
                    }]
                })
            }
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

export const ViewViewDetailed: DynamicViewRenderer = ({data}) => {
    const pages = window.unigraph.getState('registry/pages').value;
    return pages[data.get('view').as('primitive').replace('/pages/', '')]
        .constructor(JSON.parse(data.get('props').as('primitive')).config)
}

export const AutoDynamicView = ({ object, callbacks, component, attributes, inline, allowSubentity, style, noDrag, noDrop, noContextMenu }: AutoDynamicViewProps) => {
    allowSubentity = allowSubentity === true;

    const [{ isDragging }, drag] = useDrag(() => ({
        type: object?.['type']?.['unigraph.id'] || "$/schema/any",
        item: {uid: object?.uid, itemType: object?.type?.['unigraph.id']},
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging()
        })
    }))

    const [, drop] = useDrop(() => ({
          accept: window.unigraph.getState('referenceables/semantic_children').value,
          drop: (item: {uid: string, itemType: string}, monitor) => {
            if (!monitor.didDrop()) {
                window.unigraph.updateObject(object?.uid, {
                    children: [{
                        "type": {"unigraph.id": "$/schema/interface/semantic"},
                        "_value": {
                            "type": {"unigraph.id": item.itemType},
                            uid: item.uid
                        }
                    }]
                })
            }
          },
    }))

    const handlers = useSwipeable({
        onSwipedRight: (eventData) => onUnigraphContextMenu(({clientX: eventData.absX, clientY: eventData.absY} as any), object, contextEntity, callbacks),
      });

    const contextEntity = typeof callbacks?.context === "object" ? callbacks.context : null; 
    const [isSelected, setIsSelected] = React.useState(false);
    const selectedState = window.unigraph.getState('global/selected');
    selectedState.subscribe((sel: any) => {if (sel?.includes?.(object.uid)) setIsSelected(true); else setIsSelected(false);})

    const attach = React.useCallback((domElement) => {
        if (!noDrag) drag(domElement);
        if (!noDrop) drop(domElement);
    }, [isDragging, drag, callbacks])

    //console.log(object) 
    let el;
    const DynamicViews = window.unigraph.getState('registry/dynamicView').value
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViews).includes(object.type['unigraph.id'])) {
        el = React.createElement(component?.[object.type['unigraph.id']] ? component[object.type['unigraph.id']] : DynamicViews[object.type['unigraph.id']], {
            data: object, callbacks: callbacks ? callbacks : undefined, ...(attributes ? attributes : {})
        });
    } else if (object) {
        el = <StringObjectViewer object={object}/>
    }
    return el ? <ErrorBoundary  FallbackComponent={({error}) => <div style={{backgroundColor: "floralwhite", borderRadius: "8px"}}>
        <Typography>Error in AutoDynamicView: </Typography>
        <p>{JSON.stringify(error, null, 4)}</p>
    </div>}>
        <div 
            id={"object-view-"+object?.uid} 
            style={{
                backgroundColor: isSelected ? "whitesmoke" : "unset",
                opacity: isDragging ? 0.5 : 1, 
                display: "inline-flex", alignItems: "center",
                ...(inline ? {} : {width: "100%"}),
                ...(isMobile() ? {touchAction: "pan-y"} : {}),
                ...style
            }} 
            ref={attach} 
            aria-label={"Object view for uid " + object?.uid + ", of type " + (object?.type?.['unigraph.id'] || "unknown")}
            onContextMenu={noContextMenu ? () => {} : (event) => onUnigraphContextMenu(event, object, contextEntity, callbacks)}
            onClickCapture={(ev) => { if (isMultiSelectKeyPressed(ev)) {ev.stopPropagation(); selectUid(object.uid, false) } }}
            {...(attributes ? attributes : {})}
            {...(isMobile() ? handlers : {})}
        >
            {el}
        </div>
        {(allowSubentity && !noDrop) ? <SubentityDropAcceptor uid={object?.uid} /> : []}
    </ErrorBoundary> : <React.Fragment/>;
}

export const AutoDynamicViewDetailed: DynamicViewRenderer = ({ object, options, callbacks, context, component }) => {
    const DynamicViewsDetailed = {...window.unigraph.getState('registry/dynamicViewDetailed').value, ...(component || {})}
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViewsDetailed).includes(object.type['unigraph.id'])) {
        return <ErrorBoundary FallbackComponent={(error) => <div>
            <Typography>Error in detailed AutoDynamicView: </Typography>
            <p>{JSON.stringify(error, null, 4)}</p>
        </div>}>
            {React.createElement(DynamicViewsDetailed[object.type['unigraph.id']], {
            data: object, callbacks, options: options || {}, context
        })}
        </ErrorBoundary>;
    } else {
        return <JsontreeObjectViewer object={object} options={options}/>
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