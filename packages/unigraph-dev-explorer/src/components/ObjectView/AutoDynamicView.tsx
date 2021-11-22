import { Typography } from '@material-ui/core';
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { useSwipeable } from 'react-swipeable';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicViewProps } from '../../types/ObjectView';
import { isMobile, isMultiSelectKeyPressed, selectUid } from '../../utils';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { StringObjectViewer } from './DefaultObjectView';
import { isStub, SubentityDropAcceptor } from './utils';

export const AutoDynamicView = ({ object, callbacks, component, attributes, inline, allowSubentity, style, noDrag, noDrop, noContextMenu }: AutoDynamicViewProps) => {
    allowSubentity = allowSubentity === true;

    const isObjectStub = isStub(object);
    const [loadedObj, setLoadedObj] = React.useState<any>(false);
    const [subsId, setSubsId] = React.useState(0);
    const getObject = () => isObjectStub ? loadedObj : object;
    const DynamicViews = {...window.unigraph.getState('registry/dynamicView').value, ...(component ? component : {})}

    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub) {
            if (subsId) window.unigraph.unsubscribe(subsId);
            let query = DynamicViews[object.type['unigraph.id']].query?.(object.uid)
            if (!query) query = `(func: uid(${object.uid})) @recurse {
                uid
                unigraph.id
                expand(_userpredicate_)
              }`
            window.unigraph.subscribeToQuery(query, (objects: any[]) => {
                setLoadedObj(objects[0]); 
            }, newSubs, true);
            setSubsId(newSubs);
            callbacks = {...callbacks, subsId: newSubs}
            return function cleanup () { window.unigraph.unsubscribe(newSubs); }
        }
    }, [object])

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
            if (!monitor.didDrop() && item.uid !== object?.uid) {
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
        onSwipedRight: (eventData) => onUnigraphContextMenu(({clientX: eventData.absX, clientY: eventData.absY} as any), getObject(), contextEntity, callbacks),
      });

    const contextEntity = typeof callbacks?.context === "object" ? callbacks.context : null; 
    const [isSelected, setIsSelected] = React.useState(false);
    const selectedState = window.unigraph.getState('global/selected');
    selectedState.subscribe((sel: any) => {if (sel?.includes?.(object?.uid)) setIsSelected(true); else setIsSelected(false);})

    const attach = React.useCallback((domElement) => {
        if (!noDrag) drag(domElement);
        if (!noDrop) drop(domElement);
        if (isMobile()) handlers.ref(domElement);
    }, [isDragging, drag, callbacks])

    //console.log(object) 
    let el;
    if (object?.type && object.type['unigraph.id'] && Object.keys(DynamicViews).includes(object.type['unigraph.id']) && getObject()) {
        el = React.createElement(DynamicViews[object.type['unigraph.id']].view, {
            data: getObject(), callbacks: callbacks ? callbacks : undefined, ...(attributes ? attributes : {})
        });
    } else if (object && getObject()) {
        el = <StringObjectViewer object={getObject()}/>
    } else {
        el = <React.Fragment />
    }
    return el ? <ErrorBoundary onError={(error: Error, info: {componentStack: string}) => {
        console.error(error);
      }} FallbackComponent={({error}) => <div style={{backgroundColor: "floralwhite", borderRadius: "8px"}}>
        <Typography>Error in AutoDynamicView: (for object {object?.uid})</Typography>
        <p>{error.message}</p>
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
            aria-label={"Object view for uid " + object?.uid + ", of type " + (object?.type?.['unigraph.id'] || "unknown")}
            onContextMenu={noContextMenu ? () => {} : (event) => onUnigraphContextMenu(event, getObject(), contextEntity, callbacks)}
            onClickCapture={(ev) => { if (isMultiSelectKeyPressed(ev)) {ev.stopPropagation(); selectUid(object.uid, false) } }}
            {...(attributes ? attributes : {})}
            ref={attach} 
        >
            {el}
        </div>
        {(allowSubentity && !noDrop) ? <SubentityDropAcceptor uid={object?.uid} /> : []}
    </ErrorBoundary> : <React.Fragment/>;
}