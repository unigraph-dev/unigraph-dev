import { Checkbox, FormControlLabel, ListItem, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { DefaultObjectListView } from '../ObjectView/DefaultObjectView';

const UserLibraryAll = () => {

    const [objects, setObjects]: [any[], Function] = React.useState([]);
    const [id, setId] = React.useState(Date.now());

    const [usingAll, setUsingAll] = React.useState(false);

    useEffectOnce(() => {
        window.unigraph.subscribeToType("any", (objects: any[]) => { setObjects(objects) }, id, usingAll);

        return function cleanup () {
            window.unigraph.unsubscribe(id);
        }
    })

    useEffect(() => {
        window.unigraph.unsubscribe(id);
        const newId = Date.now();
        window.unigraph.subscribeToType("any", (objects: any[]) => { setObjects(objects) }, newId, usingAll);
        setId(newId);

        return function cleanup () {
            window.unigraph.unsubscribe(newId);
        }
    }, [usingAll])

    return <div>
        <Typography gutterBottom variant="h4">
            Library - Recent items
        </Typography>
        <FormControlLabel control={<Checkbox
            checked={usingAll}
            onChange={() => setUsingAll(!usingAll)}
            name="usingAll"
            color="primary"
        />} label="View all items" />
        <DefaultObjectListView objects={objects} component={ListItem}/>
    </div>
}

export default UserLibraryAll;