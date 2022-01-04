/* eslint-disable @typescript-eslint/no-empty-function */
import { Typography } from '@material-ui/core';
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { useSwipeable } from 'react-swipeable';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { buildGraph, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicViewProps } from '../../types/ObjectView.d';
import { subscribeToBacklinks } from '../../unigraph-react';
import {
    DataContext, isMobile, isMultiSelectKeyPressed, selectUid, TabContext,
} from '../../utils';
import { getParentsAndReferences } from './backlinksUtils';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { StringObjectViewer } from './BasicObjectViews';
import { excludableTypes } from './GraphView';
import { getSubentities, isStub, SubentityDropAcceptor } from './utils';

export function AutoDynamicView({
    object, callbacks, component, attributes, inline, allowSubentity,
    allowSemantic = true, style, noDrag, noDrop, noContextMenu,
    subentityExpandByDefault, noBacklinks, noParents, withParent, compact,
}: AutoDynamicViewProps) {
    if (!callbacks) callbacks = {};
    allowSubentity = allowSubentity === true;

    const shouldGetBacklinks = !excludableTypes.includes(object?.type?.['unigraph.id']) && !inline;
    const [backlinks, setBacklinks] = React.useState<any>([]);

    const dataContext = React.useContext(DataContext);
    const tabContext = React.useContext(TabContext);

    const isObjectStub = isStub(object);
    const [loadedObj, setLoadedObj] = React.useState<any>(false);
    const [subsId, setSubsId] = React.useState(0);
    const [isRecursion, setIsRecursion] = React.useState<any>(undefined);
    const getObject = () => (isObjectStub ? loadedObj : object);

    const [showSubentities, setShowSubentities] = React.useState(!!subentityExpandByDefault);

    const [isSelected, setIsSelected] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(window.unigraph.getState('global/focused').value.uid === object?.uid && tabContext.isVisible());

    const [DynamicViews, setDynamicViews] = React.useState({ ...window.unigraph.getState('registry/dynamicView').value, ...(component || {}) });

    const viewEl = React.useRef(null);

    React.useEffect(() => {
        const cb = (newIts: any) => setDynamicViews({ ...window.unigraph.getState('registry/dynamicView').value, ...(component || {}) });
        window.unigraph.getState('registry/dynamicView').subscribe(cb);

        const cbsel = (sel: any) => {
            if (sel?.includes?.(object?.uid)) setIsSelected(true);
            else setIsSelected(false);
        };
        window.unigraph.getState('global/selected').subscribe(cbsel);

        const cbfoc = (foc: any) => {
            if (foc.uid === object?.uid && tabContext.isVisible()) setIsFocused(true);
            else setIsFocused(false);
        };
        window.unigraph.getState('global/focused').subscribe(cbfoc);

        return function cleanup() {
            window.unigraph.getState('registry/dynamicView').unsubscribe(cb);
            window.unigraph.getState('global/selected').unsubscribe(cbsel);
            window.unigraph.getState('global/focused').unsubscribe(cbfoc);
        };
    }, []);

    if (getSubentities(object)?.length > 0) {
        callbacks!.showSubentities = (show?: boolean) => {
            setShowSubentities(show === undefined ? !showSubentities : show);
        };
    }

    React.useEffect(() => {
        if (object?.uid?.startsWith('0x') && shouldGetBacklinks) {
            const cb = (newBacklinks: any) => {
                const [pars, refs] = getParentsAndReferences(newBacklinks['~_value'], newBacklinks['unigraph.origin'], object.uid);
                // console.log(object.uid, getParents(viewEl.current));
                setBacklinks([pars, refs].map((it) => it.filter((el) => (
                    Object.keys(DynamicViews).includes(el?.type?.['unigraph.id'])
                    && !([...getParents(viewEl.current), callbacks?.context?.uid].includes(el.uid))
                ))));
            };
            subscribeToBacklinks(object.uid, cb);
            return function cleanup() {
                subscribeToBacklinks(object.uid, cb, true);
            };
        }
        return () => {};
    }, [object?.uid, shouldGetBacklinks, DynamicViews]);

    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub) {
            console.log(tabContext);
            if (subsId) tabContext.unsubscribe(subsId);
            let query = DynamicViews[object.type?.['unigraph.id']]?.query?.(object.uid);
            if (!query) {
                query = `(func: uid(${object.uid})) @recurse {
                uid
                unigraph.id
                expand(_userpredicate_)
              }`;
            }
            tabContext.subscribeToQuery(query, (objects: any[]) => {
                setLoadedObj(buildGraph(objects)[0]);
            }, newSubs, { noExpand: true });
            setSubsId(newSubs);
            callbacks = { ...callbacks, subsId: newSubs };
            return function cleanup() { tabContext.unsubscribe(newSubs); };
        }
        return () => {};
    }, [object.uid]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: object?.type?.['unigraph.id'] || '$/schema/any',
        item: {
            uid: object?.uid,
            itemType: object?.type?.['unigraph.id'],
            dndContext: tabContext.viewId,
            dataContext: dataContext.rootUid,
            removeFromContext: callbacks?.removeFromContext,
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [, drop] = useDrop(() => ({
        accept: window.unigraph.getState('referenceables/semantic_children').value,
        drop: (item: {uid: string, itemType: string}, monitor) => {
            if (!monitor.didDrop() && allowSemantic && !noDrop && item.uid !== object?.uid) {
                window.unigraph.updateObject(object?.uid, {
                    children: [{
                        type: { 'unigraph.id': '$/schema/interface/semantic' },
                        _value: {
                            type: { 'unigraph.id': item.itemType },
                            uid: item.uid,
                        },
                    }],
                });
            }
        },
    }));

    const handlers = useSwipeable({
        onSwipedRight: (eventData) => onUnigraphContextMenu(
            ({ clientX: eventData.absX, clientY: eventData.absY } as any),
            getObject(),
            contextEntity,
            callbacks,
        ),
    });

    const contextEntity = typeof callbacks?.context === 'object' ? callbacks.context : null;

    function getParents(elem: any) {
        const parents: any[] = [];
        if (!elem) return parents;
        while (elem.parentNode && elem.parentNode.nodeName.toLowerCase() != 'body') {
            elem = elem.parentNode;
            if (!elem) return parents;
            if (elem.id?.startsWith?.('object-view-')) parents.push(elem.id.slice(12));
        }
        return parents;
    }

    const attach = React.useCallback((domElement) => {
        if (domElement && object.uid) {
            const ids = getParents(domElement);
            if (ids.includes(object?.uid) && !inline) {
                // recursive - deal with it somehow
                setIsRecursion(true);
            } else setIsRecursion(false);
        } else if (!object.uid) {
            setIsRecursion(false);
        }

        if (!noDrag) drag(domElement);
        if (!noDrop) drop(domElement);
        if (isMobile()) handlers.ref(domElement);
        viewEl.current = domElement;
    }, [isDragging, drag, callbacks]);

    const BacklinkComponent = (
        <div
            style={{
                display: (shouldGetBacklinks && (backlinks?.[1]?.length || (!noParents && backlinks?.[0]?.length > 0))) ? '' : 'none',
                marginLeft: 'auto',
                background: 'lightgray',
                padding: '2px 6px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
            }}
            onClick={() => { window.wsnavigator(`/library/backlink?uid=${object?.uid}`); }}
        >
            {(noParents ? 0 : backlinks?.[0]?.length || 0) + (backlinks?.[1]?.length || 0)}
        </div>
    );

    const getEl = React.useCallback((viewId, setTitle) => {
        if (isRecursion === false && object?.type && object.type['unigraph.id'] && Object.keys(DynamicViews).includes(object.type['unigraph.id']) && getObject()) {
            return React.createElement(DynamicViews[object.type['unigraph.id']].view, {
                data: getObject(),
                callbacks: {
                    viewId,
                    setTitle,
                    ...(callbacks || {}),
                    ...(noBacklinks ? { BacklinkComponent } : {}),
                },
                ...(attributes || {}),
                inline,
                compact,
                focused: isFocused,
            });
        } if (isRecursion === false && object && getObject()) {
            return <StringObjectViewer object={getObject()} />;
        } if (isRecursion === true) {
            return (
                <Typography style={{ color: 'red' }}>
                    Recursive element (uid:
                    {' '}
                    {object.uid}
                    ), ignored!
                </Typography>
            );
        }
        return '';
    }, [isRecursion, object, object?.uid, callbacks, attributes,
        DynamicViews, isObjectStub, loadedObj, isFocused, backlinks]);

    return (
        <ErrorBoundary
            onError={(error: Error, info: {componentStack: string}) => {
                console.error(error);
            }}
            // eslint-disable-next-line react/no-unstable-nested-components
            FallbackComponent={({ error }) => (
                <div style={{ backgroundColor: 'floralwhite', borderRadius: '8px' }} onContextMenu={noContextMenu ? () => false : (event) => onUnigraphContextMenu(event, getObject(), contextEntity, callbacks)}>
                    <Typography>
                        Error in AutoDynamicView: (for object
                        {object?.uid}
                        )
                    </Typography>
                    <p>{error.message}</p>
                </div>
            )}
        >
            <div
                style={{
                    display: inline ? 'inline' : 'block', ...(inline ? {} : { width: '100%' }), backgroundColor: (isSelected || isDragging) ? 'whitesmoke' : 'unset', borderRadius: (isSelected || isDragging) ? '12px' : '',
                }}
                key={`object-view-${object?.uid}`}
            >
                <div
                    id={`object-view-${object?.uid}`}
                    style={{
                        opacity: isDragging ? 0 : 1,
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center',
                        ...(inline ? {} : { width: '100%' }),
                        ...(isMobile() ? { touchAction: 'pan-y' } : {}),
                        ...style,
                    }}
                    aria-label={`Object view for uid ${object?.uid}, of type ${object?.type?.['unigraph.id'] || 'unknown'}`}
                    onContextMenu={noContextMenu
                        ? () => false
                        : (event) => onUnigraphContextMenu(event, getObject(), contextEntity, callbacks)}
                    onClickCapture={(ev) => {
                        if (isMultiSelectKeyPressed(ev)) { ev.stopPropagation(); selectUid(object.uid, false); }
                    }}
                    {...(attributes || {})}
                    ref={attach}
                >
                    {getEl(tabContext.viewId, tabContext.setTitle)}
                    {noBacklinks ? [] : BacklinkComponent}
                </div>

                {showSubentities && getSubentities(object)?.length > 0 ? (
                    <div style={{ width: '100%', paddingLeft: '24px' }}>
                        <ul>
                            {getSubentities(object)
                            .map((el: any) => (
                                <li>
                                    <AutoDynamicView
                                        object={new UnigraphObject(el._value)}
                                        callbacks={callbacks}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : []}
                {(allowSubentity && !noDrop) ? <SubentityDropAcceptor uid={object?.uid} /> : []}
            </div>
        </ErrorBoundary>
    );
}
