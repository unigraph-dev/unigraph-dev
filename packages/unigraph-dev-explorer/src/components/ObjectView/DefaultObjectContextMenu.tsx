import { Menu, MenuItem } from '@material-ui/core';
import React from 'react';
import { useHistory } from "react-router-dom";

export const DefaultObjectContextMenu = ({uid, object, anchorEl, handleClose}: 
    {uid: string, object: any, anchorEl: null|HTMLElement, handleClose: any}) => {
    const history = useHistory();

    return (<Menu
        id={`context-menu-${uid}`}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
    >
        <MenuItem onClick={() => {handleClose(); history.push(`/library/object/${uid}`)}}>View object</MenuItem>
    </Menu>)
}