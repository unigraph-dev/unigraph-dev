import { Menu, MenuItem } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicViewCallbacks, ContextMenuGenerator } from '../../types/ObjectView';
import { isMultiSelectKeyPressed, NavigationContext, selectUid } from '../../utils';
import { getComponentAsView } from './DynamicComponentView';

export const defaultContextMenu: Array<ContextMenuGenerator> = [
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"dynamic-view-detailed"}`)}}>
        View object with its default
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/object?uid=${uid}&viewer=${"json-tree"}`)}}>
        View object with JSON tree viewer
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/object-editor?uid=${uid}`)}}>
        View object with rich object editor
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.unigraph.runExecutable('$/executable/add-item-to-list', {where: "$/entity/inbox", item: uid})}}>
        Add item to inbox
    </MenuItem>,
    (uid, object, handleClose, callbacks) => <MenuItem onClick={() => {handleClose(); window.wsnavigator(`/library/backlink?uid=${uid}`);}}>
        View backlinks
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