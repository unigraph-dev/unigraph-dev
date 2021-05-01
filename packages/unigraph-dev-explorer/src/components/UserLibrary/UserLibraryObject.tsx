import { Checkbox, FormControlLabel, Typography } from '@material-ui/core';
import React from 'react';

import { useParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { DefaultObjectView } from '../ObjectView/DefaultObjectView';

export default function UserLibraryObject ({ uid }: any) {
    let objectId: any = uid;

    const [object, setObject]: [any, Function] = React.useState(undefined);
    const [id, setId] = React.useState(Date.now());

    const [showPadded, setShowPadded] = React.useState(false);

    useEffectOnce(() => {
        window.unigraph.subscribeToObject(objectId, (object: any) => {
            setObject(object)
        }, id);

        return function cleanup () {
            window.unigraph.unsubscribe(id);
        }
    })

    return (<div>
        <DefaultObjectView object={object} options={{
            viewer: "dynamic-view-detailed",
            canEdit: true,
            unpad: !showPadded
        }}></DefaultObjectView>
    </div>)
}