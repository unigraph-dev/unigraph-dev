import React from 'react';
import { TabContext } from '../../utils';

import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';
import { DefaultObjectView } from '../ObjectView/DefaultObjectView';

export default function DetailedObjectView({ uid, viewer, id, context, component, callbacks, isStub, type }: any) {
    // console.log(uid, isStub, type)
    const objectId: any = uid;

    const viewerId = viewer || 'dynamic-view-detailed';

    const [object, setObject]: [any, any] = React.useState(undefined);
    const [contextObj, setContextObj] = React.useState<any>(undefined);
    const [myid, setId] = React.useState<any>();

    const [showPadded, setShowPadded] = React.useState(false);

    const [DynamicViewsDetailed, setDynamicViewsDetailed] = React.useState({
        ...window.unigraph.getState('registry/dynamicViewDetailed').value,
        ...(component || {}),
    });

    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        window.unigraph
            .getState('registry/dynamicViewDetailed')
            .subscribe((newIts) => setDynamicViewsDetailed({ ...newIts, ...(component || {}) }));
    }, []);

    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
        if (myid !== undefined) {
            if (
                !isStub &&
                (viewerId !== 'dynamic-view-detailed' ||
                    !Object.keys(DynamicViewsDetailed).includes(type) ||
                    !DynamicViewsDetailed[type].query)
            ) {
                tabContext.subscribeToObject(
                    objectId,
                    (newObjs: any) => {
                        setObject(newObjs);
                    },
                    myid,
                );

                if (context?.startsWith?.('0x')) {
                    setContextObj({
                        type: { 'unigraph.id': '$/skeleton/default' },
                        uid: '0x0',
                    });
                    tabContext.subscribeToObject(context, (obj: any) => setContextObj(obj), myid! + 1);
                }

                return function cleanup() {
                    tabContext.unsubscribe(myid as any);
                    tabContext.unsubscribe(myid! + 1);
                };
            }
            setObject({
                uid,
                type: { 'unigraph.id': type },
                _stub: true,
            });
        }
    }, [myid]);

    React.useEffect(() => {
        setId(Date.now());
    }, [uid]);

    return viewerId !== 'dynamic-view-detailed' ? (
        <React.Fragment key={object?.uid}>
            <DefaultObjectView
                object={object}
                options={{
                    viewer: viewerId,
                    canEdit: true,
                    unpad: !showPadded,
                    viewId: id,
                }}
                callbacks={{ subsId: myid }}
            />
        </React.Fragment>
    ) : (
        <React.Fragment key={object?.uid}>
            <AutoDynamicViewDetailed
                object={object}
                options={{
                    viewId: id,
                }}
                callbacks={{ ...callbacks, subsId: myid, viewId: id }}
                context={contextObj}
                components={component}
            />
        </React.Fragment>
    );
}
