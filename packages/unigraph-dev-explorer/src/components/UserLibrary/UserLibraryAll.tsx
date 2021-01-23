import { Button, ButtonGroup, Checkbox, FormControlLabel, List, ListItem, Typography } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { DefaultObjectView, DefaultObjectListView } from '../ObjectView/DefaultObjectView';

const UserLibraryAll = () => {

    const [objects, setObjects]: [any[], Function] = React.useState([]);
    const [id, setId] = React.useState(Date.now());
    const [showDeleted, setShowDeleted] = React.useState(false);

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
        <FormControlLabel control={<Checkbox
            checked={showDeleted}
            onChange={() => setShowDeleted(!showDeleted)}
            name="showDeleted"
            color="primary"
        />} label="Show Deleted"/>
        <List>
            <DefaultObjectListView
                component={ListItem}
                objects={objects}
                options={{filters: {showDeleted: showDeleted}}}
            />
        </List>
        
    </div>
}

export default UserLibraryAll;