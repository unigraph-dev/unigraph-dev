import { Button, ButtonGroup, List, ListItem, Typography } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';
import DefaultObjectView from '../ObjectView/DefaultObjectView';

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
        <Typography gutterBottom variant="h5">
            Library - All Items
        </Typography>
        <ButtonGroup color="primary" aria-label="outlined primary button group">
            <Button>Export All</Button>
            <Button>Export Selected</Button>
            <Button>Select All</Button>
        </ButtonGroup>
        <List>
            {objects.map(obj => <ListItem><DefaultObjectView object={obj} options={{}} /></ListItem>)}
        </List>
        
    </div>
}

export default UserLibraryAll;