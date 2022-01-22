/* eslint-disable no-shadow */
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import Icon from '@mdi/react';
import {
    mdiCloseBoxOutline,
    mdiCloseBoxMultipleOutline,
    mdiViewDayOutline,
    mdiFileTreeOutline,
    mdiVectorPolylineEdit,
    mdiInboxArrowDownOutline,
    mdiLinkBoxVariantOutline,
    mdiDeleteOutline,
    mdiGraphOutline,
    mdiBookOutline,
} from '@mdi/js';
import { AutoDynamicViewCallbacks, ContextMenuGenerator } from '../../types/ObjectView.d';
import { isMultiSelectKeyPressed, runClientExecutable, selectUid } from '../../utils';

export const defaultContextMenu: Array<ContextMenuGenerator> = [
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                window.wsnavigator(
                    `/library/object?uid=${uid}&viewer=${'dynamic-view-detailed'}&type=${
                        object?.type?.['unigraph.id']
                    }`,
                );
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiViewDayOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>View object with its default</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                window.wsnavigator(`/library/object?uid=${uid}&viewer=${'json-tree'}`);
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiFileTreeOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>View object with JSON tree viewer</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                window.wsnavigator(`/object-editor?uid=${uid}`);
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiVectorPolylineEdit} size={0.8} />
            </ListItemIcon>
            <ListItemText>View object with rich object editor</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                window.unigraph.runExecutable('$/executable/add-item-to-list', {
                    where: '$/entity/inbox',
                    item: uid,
                });
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiInboxArrowDownOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>Add item to inbox</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                window.unigraph.runExecutable('$/executable/add-item-to-list', {
                    where: '$/entity/read_later',
                    item: uid,
                });
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiBookOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>Add item to read later</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                window.wsnavigator(`/library/backlink?uid=${uid}`);
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiLinkBoxVariantOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>View backlinks</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                window.unigraph.deleteObject(uid);
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiDeleteOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>Delete item</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '0px' }}
            onClick={() => {
                handleClose();
                window.wsnavigator(`/graph?uid=${uid}`);
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiGraphOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>Show Graph view</ListItemText>
        </MenuItem>
    ),
];

export const defaultContextContextMenu: Array<ContextMenuGenerator> = [
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                callbacks?.removeFromContext?.();
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiCloseBoxOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>Remove item from context</ListItemText>
        </MenuItem>
    ),
    (uid, object, handleClose, callbacks) => (
        <MenuItem
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
            onClick={() => {
                handleClose();
                callbacks?.removeFromContext?.('left');
            }}
        >
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiCloseBoxMultipleOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>Remove all items above (on the left) from context</ListItemText>
        </MenuItem>
    ),
];

export function DefaultObjectContextMenu({
    uid,
    object,
    anchorEl,
    handleClose,
}: {
    uid: string;
    object: any;
    anchorEl: null | HTMLElement;
    handleClose: any;
}) {
    return (
        <Menu id={`context-menu-${uid}`} anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <>{defaultContextMenu.map((el) => el(uid, object, handleClose))}</>
        </Menu>
    );
}

export const getObjectContextMenuQuery = (schema: string, onlyShortcuts = false) => `(func: uid(uids)) @recurse{
    uid
unigraph.id
expand(_userpredicate_)
}
uids as var(func: uid(items)) @filter(uid(origins, originsAny)) @cascade {
    uid
    ${
        onlyShortcuts === true
            ? `_value {
        is_shortcut @filter(eq(<_value.!>, true)) {
            <_value.!>
        }
    }`
            : ''
    }
}
var(func: eq(<unigraph.id>, "${schema}")) {
    <unigraph.origin> {
        origins as uid
}
}

var(func: eq(<unigraph.id>, "$/schema/any")) {
    <unigraph.origin> {
        originsAny as uid
}
}

var(func: eq(<unigraph.id>, "$/schema/context_menu_item")) {
    <~type> {
        items as uid
}
}`;

export const onDynamicContextMenu = (data: any, uid: string, object: any, callbacks?: any, contextUid?: string) => {
    const view = data._value?.view?._value;
    console.log(view);
    const onClick = data._value?.on_click?._value;
    if (
        view &&
        view?._value?.view?._value?.['dgraph.type']?.includes?.('Executable') &&
        view?._value.view?._value?._value?.env?.['_value.%']?.startsWith?.('component')
    ) {
        window.newTab(window.layoutModel, {
            type: 'tab',
            name: view?._value?.name?.['_value.%'] || 'Custom view',
            component: `/pages/${view._value.view._value.uid}`,
            enableFloat: 'true',
            config: { object, contextUid },
        });
    } else if (onClick && onClick['dgraph.type']?.includes?.('Executable')) {
        window.unigraph.runExecutable(onClick.uid, { uid, contextUid }, undefined, true).then((ret: any) => {
            if (ret?.return_function_component !== undefined) {
                // Not a component, but custom code to be run here
                runClientExecutable(ret.return_function_component, {
                    uid,
                    callbacks,
                    contextUid,
                });
            }
        });
    }
};

/**
 * Unigraph context menu wrapper.
 *
 * @param event
 * @param object
 * @param context
 * @param callbacks
 * @param extra UI-specific context menu items. These are not stored in the database and instead fixed with particular UIs because they are subject to individual views.
 */
export const onUnigraphContextMenu = (
    event: React.MouseEvent,
    object: UnigraphObject | any,
    context?: UnigraphObject | any,
    callbacks?: AutoDynamicViewCallbacks,
    extra?: any,
) => {
    event.preventDefault?.();
    event.stopPropagation?.();

    const compId = callbacks?.componentId || object?.uid;

    selectUid(compId, !isMultiSelectKeyPressed(event));

    window.unigraph.getState('global/contextMenu').setValue({
        anchorPosition: { top: event.clientY, left: event.clientX },
        menuContent: defaultContextMenu,
        menuContextContent: defaultContextContextMenu,
        contextObject: object,
        contextUid: object?.uid,
        show: true,
        ...(context
            ? {
                  contextContextObject: context,
                  contextContextUid: context.uid,
                  getContext: context,
              }
            : {}),
        schemaMenuContent: [],
        extraContent: extra,
        callbacks,
        windowName: window.name,
        ...(callbacks?.removeFromContext ? { removeFromContext: callbacks.removeFromContext } : {}),
    });

    // TODO: Currently lazy-loaded context menus. Should we eagarly load them in the future?
    if (object.type?.['unigraph.id']) {
        window.unigraph.getQueries([getObjectContextMenuQuery(object.type['unigraph.id'])]).then((res: any) => {
            const items = res[0];
            console.log(items);
            window.unigraph.getState('global/contextMenu').setValue({
                ...window.unigraph.getState('global/contextMenu').value,
                schemaMenuContent: items.map(
                    (el: any) =>
                        function (uid: string, object: any, onfire: () => any, callbacks?: any, contextUid?: string) {
                            return (
                                <MenuItem
                                    style={{
                                        paddingTop: '2px',
                                        paddingBottom: '2px',
                                    }}
                                    onClick={() => {
                                        onfire();
                                        onDynamicContextMenu(el, uid, object, callbacks, contextUid);
                                    }}
                                >
                                    {new UnigraphObject(el).get('icon')?.as('primitive') ? (
                                        <ListItemIcon
                                            style={{
                                                minWidth: '19px',
                                                minHeight: '19px',
                                                marginRight: '12px',
                                                backgroundImage: `url("data:image/svg+xml,${new UnigraphObject(el)
                                                    .get('icon')
                                                    ?.as('primitive')}")`,
                                                opacity: 0.54,
                                            }}
                                        />
                                    ) : (
                                        []
                                    )}
                                    <ListItemText>
                                        {new UnigraphObject(el).get('name').as('primitive') || ''}
                                    </ListItemText>
                                </MenuItem>
                            );
                        },
                ),
            });
        });
    }
};
