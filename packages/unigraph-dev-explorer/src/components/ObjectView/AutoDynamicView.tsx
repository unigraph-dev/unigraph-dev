/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Typography } from '@mui/material';
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { useSwipeable } from 'react-swipeable';
import { UnigraphObject, getRandomInt, getRandomId } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicViewProps, ComponentData, DynamicViewOptions } from '../../types/ObjectView.d';
import {
    DataContext,
    DataContextType,
    DataContextWrapper,
    isMobile,
    isMultiSelectKeyPressed,
    selectUid,
    TabContext,
    trivialTypes,
} from '../../utils';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { StringObjectViewer } from './BasicObjectViews';
import { getSubentities, isStub, SubentityDropAcceptor } from './utils';
import { registerKeyboardShortcut, removeKeyboardShortcut } from '../../keyboardShortcuts';
import { useFocusDelegate, useSelectionDelegate } from './AutoDynamicView/FocusSelectionDelegate';
import { useBacklinkDelegate } from './AutoDynamicView/BacklinkDelegate';
import { useSubscriptionDelegate } from './AutoDynamicView/SubscriptionDelegate';

export function AutoDynamicView({
    object,
    callbacks,
    components,
    attributes,
    options,
    style: propStyle,
    onClick,
    shortcuts,
    setBacklinkComponent,
    ...props
}: AutoDynamicViewProps) {
    const [DynamicViews, setDynamicViews] = React.useState({
        ...window.unigraph.getState('registry/dynamicView').value,
        ...(components || {}),
    });

    const finalOptions = { ...options, ...DynamicViews[object?.type?.['unigraph.id']]?.options };
    const {
        noDrag,
        noDrop,
        noContextMenu,
        subentityExpandByDefault,
        noBacklinks,
        noSubentities,
        noParents,
        compact,
        noClickthrough,
        inline,
        allowSubentity,
        customBoundingBox,
        allowSemantic = true,
        expandedChildren,
        backlinkStyle,
        noSwipe,
        style: optionStyle,
    } = finalOptions;

    const style = React.useMemo(() => {
        return { ...(propStyle || {}), ...optionStyle };
    }, [propStyle, optionStyle]);

    if (!callbacks) callbacks = {};

    const shouldGetBacklinks =
        !finalOptions.ignoreBacklinks &&
        (finalOptions.shouldGetBacklinks || (!trivialTypes.includes(object?.type?.['unigraph.id']) && !inline));

    const dataContext = React.useContext(DataContext);
    const tabContext = React.useContext(TabContext);

    const [componentId, setComponentId] = React.useState(getRandomId());
    const [isRecursion, setIsRecursion] = React.useState<any>(false);
    const [getObject_, subsId] = useSubscriptionDelegate(
        object?.uid,
        object?.type?.['unigraph.id'],
        DynamicViews[object?.type?.['unigraph.id']],
        object,
    );
    const getObjectRef = React.useRef<any>();
    getObjectRef.current = getObject_;

    const [canClickthrough, setCanClickthrough] = React.useState(
        Object.keys(window.unigraph.getState('registry/dynamicViewDetailed').value).includes(
            object?.type?.['unigraph.id'],
        ),
    );

    const [showSubentities, setShowSubentities] = React.useState(!!subentityExpandByDefault);

    const [isSelected] = useSelectionDelegate(object?.uid, componentId);
    const [isFocused, removeFocusOnUnmount] = useFocusDelegate(object?.uid, componentId);
    const [totalParents, BacklinkComponent] = useBacklinkDelegate(
        object?.uid,
        callbacks?.context?.uid,
        shouldGetBacklinks,
        noParents,
        backlinkStyle,
    );

    const viewEl = React.useRef(null);

    const dataRef = React.useRef<ComponentData | null>(null);
    dataRef.current = {
        uid: object?.uid,
        type: object?.type?.['unigraph.id'] || getObject_()?.type?.['unigraph.id'],
        componentId,
        getObject: getObject_,
        isSelected: isSelected as boolean,
        isFocused: isFocused as boolean,
        totalParents,
        dataContext,
        tabContext,
        callbacks,
        options: finalOptions,
    };

    React.useEffect(() => {
        const cb = (newIts: any) =>
            setDynamicViews({
                ...window.unigraph.getState('registry/dynamicView').value,
                ...(components || {}),
            });
        window.unigraph.getState('registry/dynamicView').subscribe(cb);

        const cb2 = (newIts: any) =>
            setCanClickthrough(
                Object.keys(window.unigraph.getState('registry/dynamicViewDetailed').value).includes(
                    getObjectRef.current()?.type?.['unigraph.id'] || object?.type?.['unigraph.id'],
                ),
            );
        window.unigraph.getState('registry/dynamicViewDetailed').subscribe(cb2);

        const viewElRef = viewEl.current;
        if (window.dragselect && !customBoundingBox && viewEl.current)
            window.dragselect.addSelectables([viewEl.current]);

        return function cleanup() {
            window.unigraph.getState('registry/dynamicView').unsubscribe(cb);
            window.unigraph.getState('registry/dynamicViewDetailed').unsubscribe(cb2);
            if (viewElRef) window.dragselect?.removeSelectables([viewElRef]);
            (removeFocusOnUnmount as any)();
        };
    }, []);

    React.useEffect(() => {
        if (typeof shortcuts === 'object' && Object.keys(shortcuts).length > 0) {
            Object.entries(shortcuts).forEach(([key, value]) => {
                registerKeyboardShortcut(componentId, key, value as any);
            });
        }

        return function cleanup() {
            if (typeof shortcuts === 'object' && Object.keys(shortcuts).length > 0) {
                Object.entries(shortcuts).forEach(([key, value]) => {
                    removeKeyboardShortcut(componentId, key);
                });
            }
        };
    }, [shortcuts]);

    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: object?.type?.['unigraph.id'] || '$/schema/any',
            item: {
                uid: object?.uid,
                itemType: object?.type?.['unigraph.id'],
                dndContext: tabContext.viewId,
                dataContext: dataContext.contextUid,
                removeFromContext: callbacks?.removeFromContext,
            },
            collect: (monitor) => {
                if (monitor.isDragging() && window.dragselect) {
                    window.dragselect.break();
                }
                return {
                    isDragging: !!monitor.isDragging(),
                };
            },
        }),
        [object?.type?.['unigraph.id'], object?.uid, tabContext.viewId, dataContext.contextUid],
    );

    const [, drop] = useDrop(
        () => ({
            accept: window.unigraph.getState('referenceables/semantic_children').value || [],
            drop: (item: { uid: string; itemType: string }, monitor) => {
                if (!monitor.didDrop() && allowSemantic && !noDrop && item.uid !== object?.uid) {
                    window.unigraph.updateObject(object?.uid, {
                        children: [
                            {
                                type: {
                                    'unigraph.id': '$/schema/interface/semantic',
                                },
                                _value: {
                                    uid: item.uid,
                                },
                            },
                        ],
                    });
                }
            },
        }),
        [allowSemantic, noDrop, object?.uid],
    );

    const handlers = useSwipeable({
        onSwipedRight: (eventData) => {
            if (!noSwipe)
                onUnigraphContextMenu(
                    { clientX: eventData.absX, clientY: eventData.absY } as any,
                    getObjectRef.current(),
                    contextEntity,
                    { ...callbacks, componentId },
                );
        },
    });

    const contextEntity = typeof callbacks?.context === 'object' ? callbacks.context : null;

    const attach = React.useCallback(
        (domElement) => {
            if (domElement && object?.uid && expandedChildren) {
                const ids = dataContext.getParents();
                if (ids.includes(object?.uid) && !inline) {
                    // recursive - deal with it somehow
                    setIsRecursion(true);
                } else setIsRecursion(false);
            } else if (!object?.uid) {
                setIsRecursion(false);
            }

            if (domElement) domElement.dataRef = dataRef;

            if (!noDrag && !isMobile()) drag(domElement);
            if (!noDrop) drop(domElement);
            if (isMobile() && !noContextMenu) handlers.ref(domElement);
            viewEl.current = domElement;
        },
        [isDragging, drag],
    );

    const onClickCaptureHandler = React.useCallback(
        (ev) => {
            if (isMultiSelectKeyPressed(ev)) {
                ev.stopPropagation();
                selectUid(componentId, false);
            }
        },
        [componentId],
    );

    React.useEffect(() => {
        if (noBacklinks && setBacklinkComponent) setBacklinkComponent(BacklinkComponent);
    }, [noBacklinks, setBacklinkComponent, BacklinkComponent]);

    const finalCallbacks = React.useMemo(() => {
        // console.log('callbacks recreated, ', object?.uid);
        return {
            ...(callbacks || {}),
            ...(noBacklinks ? { BacklinkComponent } : {}),
            ...(window.dragselect && customBoundingBox
                ? {
                      registerBoundingBox: (el: any) => {
                          el.dataset.component = componentId;
                          window.dragselect.addSelectables([el]);
                          el.addEventListener('pointerup', onClickCaptureHandler);
                      },
                  }
                : {}),
            ...(subsId ? { subsId } : {}),
        };
    }, [callbacks, noBacklinks, BacklinkComponent, customBoundingBox, componentId, subsId]);

    const innerEl = React.useMemo(() => {
        if (
            isRecursion === false &&
            object?.type?.['unigraph.id'] &&
            Object.keys(DynamicViews).includes(object.type['unigraph.id']) &&
            getObjectRef.current()
        ) {
            return React.createElement(DynamicViews[object.type['unigraph.id']].view, {
                data: getObjectRef.current(),
                style,
                key: object?.uid,
                ...props,
                callbacks: finalCallbacks,
                ...(attributes || {}),
                inline,
                compact,
                componentId,
                focused: isFocused,
            });
        }
        if (isRecursion === false && object && getObjectRef.current()) {
            return <StringObjectViewer object={getObjectRef.current()} />;
        }
        if (isRecursion === true) {
            return (
                <Typography style={{ color: 'red' }}>
                    Recursive element (uid: {object.uid}
                    ), ignored!
                </Typography>
            );
        }
        return '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        JSON.stringify(style),
        isRecursion,
        object,
        attributes,
        DynamicViews,
        isFocused,
        BacklinkComponent,
        getObject_,
    ]);

    return (
        <ErrorBoundary
            onError={(error: Error, info: { componentStack: string }) => {
                console.error(error);
            }}
            // eslint-disable-next-line react/no-unstable-nested-components
            FallbackComponent={({ error }) => (
                <div
                    className="m-0.5 bg-yellow-100 px-3 py-2 ring-1 ring-yellow-500 rounded-md"
                    onContextMenu={
                        noContextMenu
                            ? () => false
                            : (event) =>
                                  onUnigraphContextMenu(event, getObjectRef.current(), contextEntity, {
                                      ...callbacks,
                                      componentId,
                                  })
                    }
                >
                    <p className="mb-1">
                        <span className="text-yellow-900 font-medium text-sm">
                            Error in AutoDynamicView: (for object {object?.uid})
                        </span>
                    </p>
                    <pre className="text-sm">{error.message}</pre>
                </div>
            )}
        >
            <DataContextWrapper
                contextUid={object?.uid}
                contextData={getObjectRef.current()}
                parents={finalOptions.ignoreBacklinks ? dataContext.parents : totalParents}
                viewType="$/schema/dynamic_view"
                expandedChildren={expandedChildren || false}
                subsId={subsId}
            >
                <div
                    style={{
                        display: inline ? 'inline' : 'block',
                        ...(inline ? {} : { width: '100%' }),
                        backgroundColor: isSelected || isDragging ? 'whitesmoke' : 'unset',
                        borderRadius: isSelected || isDragging ? '6px' : '',
                        ...style,
                    }}
                    key={`object-view-${object?.uid}`}
                    onClickCapture={customBoundingBox ? () => undefined : onClickCaptureHandler}
                    onClick={(ev) => {
                        if ((!noClickthrough && canClickthrough) || typeof onClick === 'function') {
                            typeof onClick === 'function'
                                ? onClick(ev)
                                : (() => {
                                      ev.stopPropagation();
                                      ev.preventDefault();
                                      window.wsnavigator(
                                          `/library/object?uid=${object?.uid}&viewer=${'dynamic-view-detailed'}&type=${
                                              object?.type?.['unigraph.id']
                                          }&name=${getObject_()?.get?.('name')?.as('primitive') || ''}`,
                                      );
                                  })();
                        }
                    }}
                >
                    <div
                        id={`object-view-${object?.uid}`}
                        data-component={componentId}
                        style={{
                            opacity: isDragging ? 0 : 1,
                            boxSizing: 'border-box',
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: noClickthrough || !canClickthrough ? '' : 'pointer',
                            ...(inline ? {} : { width: '100%' }),
                            ...(isMobile() ? { touchAction: 'pan-y' } : {}),
                        }}
                        aria-label={`Object view for uid ${object?.uid}, of type ${
                            object?.type?.['unigraph.id'] || 'unknown'
                        }`}
                        onContextMenu={
                            noContextMenu
                                ? () => false
                                : (event) =>
                                      isDragging
                                          ? event.preventDefault()
                                          : onUnigraphContextMenu(event, getObjectRef.current(), contextEntity, {
                                                ...callbacks,
                                                componentId,
                                            })
                        }
                        {...(attributes || {})}
                        ref={attach}
                    >
                        {innerEl}
                        {noBacklinks ? [] : BacklinkComponent}
                    </div>

                    {!noSubentities && !inline && getSubentities(getObjectRef.current())?.length > 0 ? (
                        <div style={{ width: '100%', paddingLeft: '12px' }}>
                            <Typography
                                onClick={(ev) => {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    setShowSubentities(!showSubentities);
                                }}
                                variant="body2"
                                style={{ color: 'gray' }}
                            >
                                {!showSubentities ? '+ show ' : '- hide '}
                                {`${getSubentities(getObjectRef.current())?.length} subentities`}
                            </Typography>
                            {showSubentities ? (
                                <ul>
                                    {getSubentities(getObjectRef.current()).map((el: any, index: number) => (
                                        <li key={el.uid}>
                                            <AutoDynamicView
                                                object={new UnigraphObject(el._value)}
                                                components={components}
                                                callbacks={{
                                                    ...callbacks,
                                                    context: getObjectRef.current(),
                                                    index,
                                                    ...(subsId ? { subsId } : {}),
                                                }}
                                                index={index}
                                                options={{
                                                    noSubentities,
                                                    noClickthrough,
                                                }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                []
                            )}
                        </div>
                    ) : (
                        []
                    )}
                    <SubentityDropAcceptor uid={object?.uid} display={allowSubentity && !noDrop} />
                </div>
            </DataContextWrapper>
        </ErrorBoundary>
    );
}
