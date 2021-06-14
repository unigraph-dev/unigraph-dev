import { Menu, MenuItem } from '@material-ui/core';
import React from 'react';
import { NavigationContext } from '../../utils';

export const defaultContextMenu = [
    (uid: string, object: any, handleClose: () => any, callbacks?: any) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"dynamic-view-detailed"}`)}}>
    View object with its default
    </MenuItem>,
//    (uid: string, object: any, handleClose: () => any) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"dynamic-view-detailed"}`)}}>
//    View object with object editor (🚧)
//</MenuItem>,
    (uid: string, object: any, handleClose: () => any, callbacks?: any) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"json-tree"}`)}}>
    View object with JSON tree viewer
</MenuItem>,
    (uid: string, object: any, handleClose: () => any, callbacks?: any) => <MenuItem onClick={() => {handleClose(); window.unigraph.runExecutable('$/executable/add-item-to-list', {where: "$/entity/inbox", item: uid})}}>
    Add item to inbox
</MenuItem>,
    (uid: string, object: any, handleClose: () => any, callbacks?: any) => <MenuItem onClick={() => {handleClose(); window.unigraph.deleteObject(uid)}}>
    Delete item (set as deleted)
</MenuItem>]

export const defaultContextContextMenu = [
    (uid: string, object: any, handleClose: () => any, callbacks?: any) => <MenuItem onClick={() => {handleClose(); callbacks?.removeFromContext?.()}}>
    Remove item from context
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

