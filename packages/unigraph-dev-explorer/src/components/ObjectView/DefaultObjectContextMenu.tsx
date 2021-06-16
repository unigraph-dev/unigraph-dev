import { Menu, MenuItem } from '@material-ui/core';
import React from 'react';
import { ContextMenuGenerator } from '../../types/ObjectView';
import { NavigationContext } from '../../utils';

export const defaultContextMenu: Array<ContextMenuGenerator> = [
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"dynamic-view-detailed"}`)}}>
        View object with its default
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"json-tree"}`)}}>
        View object with JSON tree viewer
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.unigraph.runExecutable('$/executable/add-item-to-list', {where: "$/entity/inbox", item: uid})}}>
        Add item to inbox
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.unigraph.deleteObject(uid)}}>
        Delete item (set as deleted)
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/graph?uid=${uid}`)}}>
        Show Graph view
    </MenuItem>,
]

export const defaultContextContextMenu: Array<ContextMenuGenerator> = [
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); callbacks?.removeFromContext?.()}}>
        Remove item from context
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); callbacks?.removeFromContext?.("left")}}>
        Remove all items above (on the left) from context
    </MenuItem>
]

export const DefaultObjectContextMenu = ({uid, object, anchorEl, handleClose}: 
    {uid: string, object: any, anchorEl: null|HTMLElement, handleClose: any}) => {

    return (<Menu
        id={`context-menu-${uid}`}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
    >
        <NavigationContext.Consumer>
        { (navigator: any) => 
            <React.Fragment>
                {defaultContextMenu.map(el => el(uid, object, handleClose))}
            </React.Fragment>
        }
        </NavigationContext.Consumer>
        
    </Menu>)
}

