import { Typography } from '@material-ui/core';
import React from 'react';

import { useParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import DefaultObjectView from '../ObjectView/DefaultObjectView';

export default function UserLibraryObject () {
    let { objectId }: any = useParams();

    const [object, setObject]: [any, Function] = React.useState({});
    const [id, setId] = React.useState(Date.now());

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
        <DefaultObjectView object={object} options={{
            viewer: "json-tree",
            unpad: true
        }}></DefaultObjectView>
    </div>)
}