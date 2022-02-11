import { Typography } from '@mui/material';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { getRandomId } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicViewRenderer } from '../../global.d';
import { subscribeToBacklinks } from '../../unigraph-react';
import { DataContext, DataContextWrapper, TabContext } from '../../utils';
import { ObjectEditor } from '../ObjectEditor/ObjectEditor';
import { useBacklinkDelegate } from './AutoDynamicView/BacklinkDelegate';
import { useFocusDelegate } from './AutoDynamicView/FocusSelectionDelegate';
import { useSubscriptionDelegate } from './AutoDynamicView/SubscriptionDelegate';
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
    const tabContext = React.useContext(TabContext);

    const [DynamicViewsDetailed, setDynamicViewsDetailed] = React.useState({
        ...window.unigraph.getState('registry/dynamicViewDetailed').value,
        ...(components || {}),
    });

    const [componentId, setComponentId] = React.useState(getRandomId());

    const [isFocused, removeFocusOnUnmount] = useFocusDelegate(object?.uid, componentId);
    const [totalParents] = useBacklinkDelegate(object?.uid, callbacks?.context?.uid, true, false);

    React.useEffect(() => {
        const cbDVD = (newIts: any) => setDynamicViewsDetailed({ ...newIts, ...(components || {}) });
        window.unigraph.getState('registry/dynamicViewDetailed').subscribe(cbDVD);

        return function cleanup() {
            window.unigraph.getState('registry/dynamicViewDetailed').unsubscribe(cbDVD);
            (removeFocusOnUnmount as any)();
        };
    }, []);

    const [getObject, subsId] = useSubscriptionDelegate(
        object?.uid,
        DynamicViewsDetailed[object?.type?.['unigraph.id']],
        object,
        onLoad,
    );
    React.useEffect(() => {
        if (Object.keys(DynamicViewsDetailed).includes(object?.type?.['unigraph.id']) && !callbacks?.isEmbed) {
            tabContext.setMaximize(DynamicViewsDetailed[object.type['unigraph.id']].maximize);
        }
    }, [object]);

    if (subsId) callbacks = { ...callbacks, subsId };

    if (
        object?.type &&
        object.type['unigraph.id'] &&
        Object.keys(DynamicViewsDetailed).includes(object.type['unigraph.id']) &&
        getObject()
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
                    contextData={getObject()}
                    parents={totalParents}
                    viewType="$/schema/dynamic_view_detailed"
                    expandedChildren
                >
                    <div style={{ display: 'contents' }} id={`object-view-${object.uid}`}>
                        <TabContext.Consumer>
                            {({ viewId, setTitle }) =>
                                React.createElement(DynamicViewsDetailed[object.type['unigraph.id']].view, {
                                    data: getObject(),
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
        return object && getObject() ? <ObjectEditor uid={object?.uid} /> : <span />;
    }
    return <span />;
};
