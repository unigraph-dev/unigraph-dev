import { Checkbox, FormControlLabel, Typography } from '@material-ui/core';
import React from 'react';

import { useParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { DefaultObjectView } from '../ObjectView/DefaultObjectView';

export default function UserLibraryObject ({ uid }: any) {
    let objectId: any = uid;

    const [object, setObject]: [any, Function] = React.useState({});
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
        <Typography variant="h5">Object View</Typography>
        <FormControlLabel control={<Checkbox
            checked={showPadded}
            onChange={() => setShowPadded(!showPadded)}
            name="showPadded"
            color="primary"
        />} label="Show object as padded"/>
        <DefaultObjectView object={object} options={{
            viewer: "json-tree",
            unpad: !showPadded
        }}></DefaultObjectView>
    </div>)
}