import { Typography } from '@material-ui/core';
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { useSwipeable } from 'react-swipeable';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicViewProps } from '../../types/ObjectView';
import { isMobile, isMultiSelectKeyPressed, selectUid } from '../../utils';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { StringObjectViewer } from './DefaultObjectView';
import { getSubentities, isStub, SubentityDropAcceptor } from './utils';

export const AutoDynamicView = ({ object, callbacks, component, attributes, inline, allowSubentity, style, noDrag, noDrop, noContextMenu }: AutoDynamicViewProps) => {
    if (!callbacks) callbacks = {};
    allowSubentity = allowSubentity === true;

    const isObjectStub = isStub(object);
    const [loadedObj, setLoadedObj] = React.useState<any>(false);
    const [subsId, setSubsId] = React.useState(0);
    const [isRecursion, setIsRecursion] = React.useState<any>(undefined);
    const getObject = () => isObjectStub ? loadedObj : object;

    const [showSubentities, setShowSubentities] = React.useState(false);

    const DynamicViews = {...window.unigraph.getState('registry/dynamicView').value, ...(component ? component : {})}

    if (getSubentities(object)?.length > 0) {
        callbacks!.showSubentities = (show?: boolean) => { setShowSubentities(show === undefined ? !showSubentities : show) }
    }

    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub) {
            if (subsId) window.unigraph.unsubscribe(subsId);
            let query = DynamicViews[object.type['unigraph.id']]?.query?.(object.uid)
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

    function getParents(elem: any) {
        var parents = [];
        while(elem.parentNode && elem.parentNode.nodeName.toLowerCase() != 'body') {
          elem = elem.parentNode;
          if (elem.id) parents.push(elem.id);
        }
        return parents;
      }

    const attach = React.useCallback((domElement) => {
        if (domElement && object.uid) {
            const ids = getParents(domElement);
            if (ids.includes("object-view-"+object?.uid)) {
                // recursive - deal with it somehow
                setIsRecursion(true);
            } else setIsRecursion(false);
        } else if (!object.uid) {
            setIsRecursion(false)
        }

        if (!noDrag) drag(domElement);
        if (!noDrop) drop(domElement);
        if (isMobile()) handlers.ref(domElement);
    }, [isDragging, drag, callbacks])

    let el;
    if (isRecursion === false && object?.type && object.type['unigraph.id'] && Object.keys(DynamicViews).includes(object.type['unigraph.id']) && getObject()) {
        el = React.createElement(DynamicViews[object.type['unigraph.id']].view, {
            data: getObject(), callbacks: callbacks ? callbacks : undefined, ...(attributes ? attributes : {})
        });
    } else if (isRecursion === false && object && getObject()) {
        el = <StringObjectViewer object={getObject()}/>
    } else if (isRecursion === true) {
        el = <Typography style={{color: "red"}}>
            Recursive element (uid: {object.uid}), ignored!
        </Typography>
    } else {
        el = <React.Fragment />
    }
    
    return el ? <ErrorBoundary onError={(error: Error, info: {componentStack: string}) => {
        console.error(error);
      }} FallbackComponent={({error}) => <div style={{backgroundColor: "floralwhite", borderRadius: "8px"}}>
        <Typography>Error in AutoDynamicView: (for object {object?.uid})</Typography>
        <p>{error.message}</p>
    </div>}>
        <div style={{display: inline ? "inline" : "block", ...(inline ? {} : {width: "100%"}),}}>
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
        {showSubentities ? <div style={{width: "100%", paddingLeft: "24px"}}>
                <ul>{getSubentities(object).map((el: any) => <li><AutoDynamicView object={new UnigraphObject(el['_value'])} callbacks={callbacks} /></li>)}</ul>
            </div> : []}
        {(allowSubentity && !noDrop) ? <SubentityDropAcceptor uid={object?.uid} /> : []}
        </div>
    </ErrorBoundary> : <React.Fragment/>;
}