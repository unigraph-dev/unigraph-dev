import { Typography } from '@material-ui/core';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { DynamicViewRenderer } from '../../global.d';
import { TabContext } from '../../utils';
import { ObjectEditor } from '../ObjectEditor/ObjectEditor';
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

    const [DynamicViewsDetailed, setDynamicViewsDetailed] = React.useState({
        ...window.unigraph.getState('registry/dynamicViewDetailed').value,
        ...(components || {}),
    });

    React.useEffect(() => {
        window.unigraph
            .getState('registry/dynamicViewDetailed')
            .subscribe((newIts) => setDynamicViewsDetailed({ ...newIts, ...(components || {}) }));
    }, []);

    const tabContext = React.useContext(TabContext);

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
                            })
                        }
                    </TabContext.Consumer>
                </div>
            </ErrorBoundary>
        );
    }
    if (useFallback) {
        return object && ((isObjectStub && loadedObj) || !isObjectStub) ? <ObjectEditor uid={object?.uid} /> : <span />;
    }
    return <span />;
};
