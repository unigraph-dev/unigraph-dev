import React from 'react';

import { List, ListItem, ListItemText, Popover, TextField, Typography } from '@material-ui/core';

export type UserSettings = {
    serverLocation: string
}

export default function Settings () {
    // @ts-ignore: When loading the app we've already ensured userSettings is going to be JSON
    const [settings, setSettings] = React.useState(JSON.parse(window.localStorage.getItem('userSettings')));

    const [anchorEl, setAnchorEl]: [any[], any] = React.useState([null]);
    const [activePopover, setActivePopover] = React.useState(-1);

    const handleClick = (event: any, n: number) => {
        let total = anchorEl; total[n] = event.currentTarget;
        setAnchorEl(total);
        setActivePopover(n);
    };

    const handleClose = () => {
        setAnchorEl([null]);
        window.localStorage.setItem('userSettings', JSON.stringify(settings));
        setActivePopover(-1);
    };

    const id0 = Boolean(anchorEl[0]) ? 'address-popover' : undefined;
    console.log(Boolean(anchorEl[0]))
    return <div>
        <Typography variant="h4">User Settings</Typography>
        <p>These setting will be stored in your localStorage. </p>
        <List>
            <ListItem button onClick={(e) => handleClick(e, 0)}>
                <ListItemText primary="Server address" secondary={`Current address: ${settings.serverLocation}`}/>
            </ListItem>
        </List>
        <Popover
            id={JSON.stringify(activePopover)}
            open={activePopover === 0}
            anchorEl={anchorEl[0]}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left', }}
            transformOrigin={{ vertical: 'top', horizontal: 'left', }}
        >
            <TextField label="New server address:" value={settings.serverLocation} onChange={(event) => {
                let newSettings = {...settings};
                newSettings.serverLocation = event.target.value;
                setSettings(newSettings);
            }}/>
        </Popover>
    </div>
}