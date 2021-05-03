import { ListItem, Typography } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { DefaultObjectListView } from '../ObjectView/DefaultObjectView';

const UserLibraryAll = () => {

    const [objects, setObjects]: [any[], Function] = React.useState([]);
    const [id, setId] = React.useState(Date.now());

    useEffectOnce(() => {
        window.unigraph.subscribeToType("any", (objects: any[]) => { setObjects(objects) }, id);

        return function cleanup () {
            window.unigraph.unsubscribe(id);
        }
    })

    return <div>
        <Typography gutterBottom variant="h4">
            Library - All Items
        </Typography>
        <DefaultObjectListView objects={objects} component={ListItem}/>
    </div>
}

export default UserLibraryAll;