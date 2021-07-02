import React from 'react';

import { useEffectOnce } from 'react-use';
import { DefaultObjectView } from '../ObjectView/DefaultObjectView';

export default function DetailedObjectView ({ uid, viewer, id }: any) {
    let objectId: any = uid;

    const viewerId = viewer ? viewer : "dynamic-view-detailed"

    const [object, setObject]: [any, Function] = React.useState(undefined);
    const [myid, setId] = React.useState(Date.now());

    const [showPadded, setShowPadded] = React.useState(false);

    useEffectOnce(() => {
        window.unigraph.subscribeToObject(objectId, (object: any) => {
            setObject(object)
        }, myid);

        return function cleanup () {
            window.unigraph.unsubscribe(myid);
        }
    })

    return (<div>
        <DefaultObjectView object={object} options={{
            viewer: viewerId,
            canEdit: true,
            unpad: !showPadded,
            viewId: id
        }} callbacks={{subsId: myid}}></DefaultObjectView>
    </div>)
}