import { Menu, MenuItem } from '@material-ui/core';
import React from 'react';
import { useHistory } from "react-router-dom";
import { NavigationContext } from '../../utils';

export const DefaultObjectContextMenu = ({uid, object, anchorEl, handleClose}: 
    {uid: string, object: any, anchorEl: null|HTMLElement, handleClose: any}) => {
    const history = useHistory();

    return (<Menu
        id={`context-menu-${uid}`}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
    >
        <NavigationContext.Consumer>
        { (navigator: any) => 
            <MenuItem onClick={() => {handleClose(); navigator(`/library/object?uid=${uid}`)}}>View object</MenuItem>
        }
        </NavigationContext.Consumer>
        
    </Menu>)
}