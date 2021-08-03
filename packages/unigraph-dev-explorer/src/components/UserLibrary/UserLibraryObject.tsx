import React from 'react';

import { AutoDynamicViewDetailed, DefaultObjectView } from '../ObjectView/DefaultObjectView';

export default function DetailedObjectView ({ uid, viewer, id, context, component }: any) {
    let objectId: any = uid;

    const viewerId = viewer ? viewer : "dynamic-view-detailed"

    const [object, setObject]: [any, Function] = React.useState(undefined);
    const [contextObj, setContextObj] = React.useState<any>(undefined);
    const [myid, setId] = React.useState(Date.now());

    const [showPadded, setShowPadded] = React.useState(false);

    React.useEffect(() => {
        
        window.unigraph.subscribeToObject(objectId, (object: any) => {
            setObject(object)
        }, myid);

        if (context?.startsWith?.('0x')) {
            setContextObj({type: {"unigraph.id": "$/skeleton/default"}, uid: "0x0"})
            window.unigraph.subscribeToObject(context, (obj: any) => setContextObj(obj), myid+1)
        }

        return function cleanup () {
            window.unigraph.unsubscribe(myid);
            window.unigraph.unsubscribe(myid+1);
        }
    }, [myid])

    React.useEffect(() => {setId(Date.now())}, [uid])

    return (viewer ? <div key={object?.uid}>
        <DefaultObjectView object={object} options={{
            viewer: viewerId,
            canEdit: true,
            unpad: !showPadded,
            viewId: id
        }} callbacks={{subsId: myid}}></DefaultObjectView>
    </div> : <div key={object?.uid} style={{height: "100%", width: "100%", opacity: object?.uid ? 1: 0}}>
        <AutoDynamicViewDetailed object={object} options={{
            viewId: id
        }} callbacks={{subsId: myid}} context={contextObj} component={component}></AutoDynamicViewDetailed>
    </div>)
}