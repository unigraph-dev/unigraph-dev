import { Typography } from '@material-ui/core';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { getRandomId } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicViewRenderer } from '../../global.d';
import { subscribeToBacklinks } from '../../unigraph-react';
import { DataContext, DataContextWrapper, TabContext } from '../../utils';
import { ObjectEditor } from '../ObjectEditor/ObjectEditor';
import { getParentsAndReferences } from './backlinksUtils';
import { isStub } from './utils';

export const AutoDynamicViewDetailed: DynamicViewRenderer = ({
    object,
    options,
    callbacks,
    context,
    components,
    attributes,
    onLoad,
    useFallback = true,
}) => {
    const isObjectStub = isStub(object);
    const [loadedObj, setLoadedObj] = React.useState<any>(false);
    const [subsId, setSubsId] = React.useState(getRandomInt());

    const dataContext = React.useContext(DataContext);
    const tabContext = React.useContext(TabContext);

    const [DynamicViewsDetailed, setDynamicViewsDetailed] = React.useState({
        ...window.unigraph.getState('registry/dynamicViewDetailed').value,
        ...(components || {}),
    });

    const [componentId, setComponentId] = React.useState(getRandomId());
    const [isFocused, setIsFocused] = React.useState(
        window.unigraph.getState('global/focused').value.uid === object?.uid && tabContext.isVisible(),
    );

    const [totalParents, setTotalParents] = React.useState<string[] | undefined>();

    React.useEffect(() => {
        if (object?.uid?.startsWith('0x')) {
            const cb = (newBacklinks: any) => {
                const [pars, refs] = getParentsAndReferences(
                    newBacklinks['~_value'],
                    newBacklinks['unigraph.origin'],
                    object.uid,
                );
                setTotalParents([...(pars || []).map((el) => el.uid), ...(refs || []).map((el) => el.uid)]);
            };
            subscribeToBacklinks(object.uid, cb);
            return function cleanup() {
                subscribeToBacklinks(object.uid, cb, true);
            };
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
    }, [object?.uid, JSON.stringify(dataContext?.getParents(true)?.sort())]);

    React.useEffect(() => {
        const cbDVD = (newIts: any) => setDynamicViewsDetailed({ ...newIts, ...(components || {}) });
        window.unigraph.getState('registry/dynamicViewDetailed').subscribe(cbDVD);

        let hasFocus = false;
        const cbfoc = (foc: any) => {
            if (foc.uid === object?.uid && tabContext.isVisible() && !foc?.component?.length) {
                hasFocus = true;
                window.unigraph.getState('global/focused').value.component = componentId;
            }
            if (
                foc.uid === object?.uid &&
                tabContext.isVisible() &&
                window.unigraph.getState('global/focused').value.component === componentId
            )
                setIsFocused(true);
            else setIsFocused(false);

            return function cleanup() {
                window.unigraph.getState('registry/dynamicViewDetailed').unsubscribe(cbDVD);
                if (hasFocus) {
                    const focused = window.unigraph.getState('global/focused');
                    focused.setValue({ ...focused.value, component: '' });
                }
            };
        };
        window.unigraph.getState('global/focused').subscribe(cbfoc);
    }, []);

    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub && Object.keys(DynamicViewsDetailed).includes(object.type?.['unigraph.id'])) {
            const query = DynamicViewsDetailed[object.type['unigraph.id']].query(object.uid);
            tabContext.subscribeToQuery(
                query,
                (objects: any[]) => {
                    setLoadedObj(objects[0]);
                    if (typeof onLoad === 'function') onLoad(objects[0]);
                },
                newSubs,
                { noExpand: true },
            );
            setSubsId(newSubs);
        }

        if (Object.keys(DynamicViewsDetailed).includes(object?.type?.['unigraph.id']) && !callbacks?.isEmbed) {
            tabContext.setMaximize(DynamicViewsDetailed[object.type['unigraph.id']].maximize);
        }

        return function cleanup() {
            tabContext.unsubscribe(newSubs);
        };
    }, [object]);

    if (isObjectStub) callbacks = { ...callbacks, subsId };

    if (
        object?.type &&
        object.type['unigraph.id'] &&
        Object.keys(DynamicViewsDetailed).includes(object.type['unigraph.id']) &&
        ((isObjectStub && loadedObj) || !isObjectStub)
    ) {
        return (
            <ErrorBoundary
                // eslint-disable-next-line react/no-unstable-nested-components
                FallbackComponent={(error) => (
                    <div>
                        <Typography>Error in detailed AutoDynamicView: </Typography>
                        <p>{JSON.stringify(error, null, 4)}</p>
                    </div>
                )}
            >
                <DataContextWrapper
                    contextUid={object.uid}
                    contextData={isObjectStub ? loadedObj : object}
                    parents={totalParents}
                    viewType="$/schema/dynamic_view_detailed"
                    expandedChildren
                >
                    <div style={{ display: 'contents' }} id={`object-view-${object.uid}`}>
                        <TabContext.Consumer>
                            {({ viewId, setTitle }) =>
                                React.createElement(DynamicViewsDetailed[object.type['unigraph.id']].view, {
                                    data: isObjectStub ? loadedObj : object,
                                    callbacks: {
                                        viewId,
                                        setTitle,
                                        ...(callbacks || {}),
                                    },
                                    options: {
                                        viewId,
                                        setTitle,
                                        ...(options || {}),
                                    },
                                    context,
                                    ...(attributes || {}),
                                    focused: isFocused,
                                })
                            }
                        </TabContext.Consumer>
                    </div>
                </DataContextWrapper>
            </ErrorBoundary>
        );
    }
    if (useFallback) {
        return object && ((isObjectStub && loadedObj) || !isObjectStub) ? <ObjectEditor uid={object?.uid} /> : <span />;
    }
    return <span />;
};
