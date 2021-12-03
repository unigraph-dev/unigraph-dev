import React from 'react';

import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';
import { DefaultObjectView } from '../ObjectView/DefaultObjectView';

export default function DetailedObjectView ({ uid, viewer, id, context, component, callbacks, isStub, type }: any) {
    console.log(uid, isStub, type)
    let objectId: any = uid;

    const viewerId = viewer ? viewer : "dynamic-view-detailed"

    const [object, setObject]: [any, Function] = React.useState(undefined);
    const [contextObj, setContextObj] = React.useState<any>(undefined);
    const [myid, setId] = React.useState<any>();

    const [showPadded, setShowPadded] = React.useState(false);

    const DynamicViewsDetailed = {...window.unigraph.getState('registry/dynamicViewDetailed').value, ...(component || {})}

    React.useEffect(() => {
        if (myid !== undefined) {
            if (!isStub && (viewerId !== "dynamic-view-detailed" || !Object.keys(DynamicViewsDetailed).includes(type) || !DynamicViewsDetailed[type].query)) {
                window.unigraph.subscribeToObject(objectId, (object: any) => {
                    setObject(object)
                }, myid);
        
                if (context?.startsWith?.('0x')) {
                    setContextObj({type: {"unigraph.id": "$/skeleton/default"}, uid: "0x0"})
                    window.unigraph.subscribeToObject(context, (obj: any) => setContextObj(obj), myid!+1)
                }
        
                return function cleanup () {
                    window.unigraph.unsubscribe(myid as any);
                    window.unigraph.unsubscribe(myid!+1);
                }
            } else setObject({
                uid,
                type: { "unigraph.id": type },
                _stub: true
            })
        }
    }, [myid])

    React.useEffect(() => {setId(Date.now())}, [uid])

    return (viewerId !== "dynamic-view-detailed" ? <React.Fragment key={object?.uid}>
        <DefaultObjectView object={object} options={{
            viewer: viewerId,
            canEdit: true,
            unpad: !showPadded,
            viewId: id
        }} callbacks={{subsId: myid}}></DefaultObjectView>
    </React.Fragment> : <React.Fragment key={object?.uid}>
        <AutoDynamicViewDetailed object={object} options={{
            viewId: id
        }} callbacks={{...callbacks, subsId: myid, viewId: id}} context={contextObj} component={component}></AutoDynamicViewDetailed>
    </React.Fragment>)
}