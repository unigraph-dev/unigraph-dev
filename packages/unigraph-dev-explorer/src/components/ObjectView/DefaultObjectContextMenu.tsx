import { ListItemIcon, ListItemText, Menu, MenuItem } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicViewCallbacks, ContextMenuGenerator } from '../../types/ObjectView';
import { isMultiSelectKeyPressed, NavigationContext, selectUid } from '../../utils';
import { getComponentAsView } from './DynamicComponentView';

import Icon from '@mdi/react'
import { mdiCubeOutline, mdiDatabaseOutline, mdiCloseBoxOutline, mdiCloseBoxMultipleOutline, mdiViewDayOutline, mdiFileTreeOutline, mdiVectorPolylineEdit, mdiInboxArrowDownOutline, mdiLinkBoxVariantOutline, mdiDeleteOutline, mdiGraphOutline } from '@mdi/js';

export const defaultContextMenu: Array<ContextMenuGenerator> = [
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"dynamic-view-detailed"}`)}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiViewDayOutline} size={1}/></ListItemIcon>
        <ListItemText>View object with its default</ListItemText>
        
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"json-tree"}`)}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiFileTreeOutline} size={1}/></ListItemIcon>
        <ListItemText>View object with JSON tree viewer</ListItemText>
        
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); window.wsnavigator(`/object-editor?uid=${uid}`)}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiVectorPolylineEdit} size={1}/></ListItemIcon>
        <ListItemText>View object with rich object editor</ListItemText>
        
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); window.unigraph.runExecutable('$/executable/add-item-to-list', {where: "$/entity/inbox", item: uid})}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiInboxArrowDownOutline} size={1}/></ListItemIcon>
        <ListItemText>Add item to inbox</ListItemText>
        
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); window.wsnavigator(`/library/backlink?uid=${uid}`);}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiLinkBoxVariantOutline} size={1}/></ListItemIcon>
        <ListItemText>View backlinks</ListItemText>
        
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); window.unigraph.deleteObject(uid)}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiDeleteOutline} size={1}/></ListItemIcon>
        <ListItemText>Delete item</ListItemText>
        
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "0px"}} onClick={() => {handleClose(); window.wsnavigator(`/graph?uid=${uid}`)}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiGraphOutline} size={1}/></ListItemIcon>
        <ListItemText>Show Graph view</ListItemText>
        
    </MenuItem>,
]

export const defaultContextContextMenu: Array<ContextMenuGenerator> = [
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); callbacks?.removeFromContext?.()}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiCloseBoxOutline} size={1}/></ListItemIcon>
        <ListItemText>Remove item from context</ListItemText>
        
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} onClick={() => {handleClose(); callbacks?.removeFromContext?.("left")}}>
        <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiCloseBoxMultipleOutline} size={1}/></ListItemIcon>
        <ListItemText>Remove all items above (on the left) from context</ListItemText>
        
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
        <React.Fragment>
            
            {defaultContextMenu.map(el => el(uid, object, handleClose))}
        </React.Fragment>
    </Menu>)
}

const getObjectContextMenuQuery = (schema: string) => `(func: uid(uids)) @recurse{
    uid
unigraph.id
expand(_userpredicate_)
}
uids as var(func: uid(origins)) @cascade {
uid
type @filter(eq(<unigraph.id>, "$/schema/context_menu_item")) {
        <unigraph.id>
}

}
var(func: eq(<unigraph.id>, "${schema}")) {
    <unigraph.origin> {
        origins as uid
}
}`

/**
 * Unigraph context menu wrapper.
 * 
 * @param event 
 * @param object 
 * @param context 
 * @param callbacks 
 * @param extra UI-specific context menu items. These are not stored in the database and instead fixed with particular UIs because they are subject to individual views.
 */
export const onUnigraphContextMenu = (event: React.MouseEvent, object: UnigraphObject | any, context?: UnigraphObject | any, callbacks?: AutoDynamicViewCallbacks, extra?: (handleClose: any) => React.ReactElement) => {
    event.preventDefault?.();
    event.stopPropagation?.();

    selectUid(object.uid, !isMultiSelectKeyPressed(event));

    window.unigraph.getState('global/contextMenu').setValue({
        anchorPosition: {top: event.clientY, left: event.clientX},
        menuContent: defaultContextMenu,
        menuContextContent: defaultContextContextMenu,
        contextObject: object,
        contextUid: object?.uid,
        show: true,
        ...(context ? {
            contextContextObject: context,
            contextContextUid: context.uid,
            getContext: context
        } : {}),
        schemaMenuContent: [],
        extraContent: extra,
        callbacks,
        windowName: window.name,
        ...(callbacks?.removeFromContext ? {removeFromContext: callbacks.removeFromContext} : {})
    })

    // TODO: Currently lazy-loaded context menus. Should we eagarly load them in the future?
    if (object.type?.['unigraph.id']) window.unigraph.getQueries([getObjectContextMenuQuery(object.type['unigraph.id'])]).then((res: any) => {
        const items = res[0];
        console.log(items); 
        window.unigraph.getState('global/contextMenu').setValue({
            ...window.unigraph.getState('global/contextMenu').value,
            schemaMenuContent: items.map((el: any) => (uid: string, object: any, onfire: () => any, callbacks?: any) => 
                <MenuItem onClick={() => {
                    onfire();
                    const view = el['_value']?.['view']?.['_value'];
                    if (view && view['dgraph.type']?.includes?.('Executable')) {
                        getComponentAsView(view, {uid, object}).then((newViewId: any) => {
                            window.newTab(window.layoutModel, {
                                type: "tab",
                                name: "Temp view",
                                component: newViewId,
                                enableFloat: "true",
                                config: {}
                            })
                        });
                    }
                }}>
                    {(new UnigraphObject(el)).get('name').as('primitive') || ""}
                </MenuItem>),
        })
    })
}