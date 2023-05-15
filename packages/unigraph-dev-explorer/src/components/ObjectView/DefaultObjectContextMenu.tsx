/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable no-shadow */
import { ListItemIcon } from '@mui/material';
import _ from 'lodash';
import React from 'react';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
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
import { AutoDynamicViewCallbacks } from '../../types/ObjectView.d';
import { isDeveloperMode, isMultiSelectKeyPressed, runClientExecutable, selectUid } from '../../utils';
import { registerContextMenuItems } from '../../unigraph-react';

export type UnigraphMenuItem = {
    text: string;
    secondary?: string;
    icon?: any;
    onClick: (
        uid: string,
        object: Record<string, any>,
        handleClose: () => void,
        callbacks?: Record<string, any>,
        contextUid?: string,
    ) => void;
    show?: () => boolean;
    shortcut?: boolean;
};

export type ContextMenuGenerator = (
    uid: string,
    object: any,
    handleClose: () => any,
    callbacks?: any,
    contextUid?: string,
) => UnigraphMenuItem;

export const defaultContextMenu: Array<UnigraphMenuItem> = [
    {
        text: 'View object details',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiViewDayOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.wsnavigator(
                `/library/object?uid=${uid}&viewer=dynamic-view-detailed&type=${object?.type?.['unigraph.id']}`,
            );
        },
    },
    {
        text: 'View object as JSON tree',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiFileTreeOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.wsnavigator(`/library/object?uid=${uid}&viewer=${'json-tree'}`);
        },
        show: () => isDeveloperMode(),
    },
    {
        text: 'Edit object in editor',
        secondary: '⌥E',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiVectorPolylineEdit} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.wsnavigator(`/object-editor?uid=${uid}`);
        },
        show: () => isDeveloperMode(),
    },
    {
        text: 'Add item to inbox',
        secondary: '⌥I',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiInboxArrowDownOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.unigraph.runExecutable('$/executable/add-item-to-list', {
                where: '$/entity/inbox',
                item: uid,
            });
        },
    },
    {
        text: 'Add item to read later',
        secondary: '⌥R',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiBookOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.unigraph.runExecutable('$/executable/add-item-to-list', {
                where: '$/entity/read_later',
                item: uid,
            });
        },
    },
    {
        text: 'View backlinks',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiLinkBoxVariantOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.wsnavigator(`/library/backlink?uid=${uid}`);
        },
    },
    {
        text: 'Delete item',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiDeleteOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.unigraph.deleteObject(uid);
        },
    },
    {
        text: 'Show Graph view',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiGraphOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            window.wsnavigator(`/graph?uid=${uid}`);
        },
    },
];

export const defaultContextContextMenu: Array<UnigraphMenuItem> = [
    {
        text: 'Remove item from context',
        secondary: '⇧⌥D',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiCloseBoxOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            callbacks?.removeFromContext?.();
        },
    },
    {
        text: 'Remove all items above (on the left) from context',
        secondary: '⇧⌥F',
        icon: (
            <ListItemIcon style={{ minWidth: '19px' }}>
                <Icon path={mdiCloseBoxMultipleOutline} size={0.8} />
            </ListItemIcon>
        ),
        onClick: (uid, object, handleClose, callbacks, contextUid) => {
            handleClose();
            callbacks?.removeFromContext?.('left');
        },
    },
];

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
    const onClick = data._value?.on_click?._value;
    console.log(view, onClick);
    if (
        view &&
        view?._value?.view?._value?.['dgraph.type']?.includes?.('Executable') &&
        view?._value.view?._value?._value?.env?.['_value.%']?.startsWith?.('component')
    ) {
        window.newTab({
            type: 'tab',
            name: view?._value?.name?.['_value.%'] || 'Custom view',
            component: `/pages/${view._value.view._value.uid}`,
            enableFloat: 'true',
            config: { object, contextUid },
        });
    } else if (onClick && onClick?.type?.['unigraph.id'] === '$/schema/executable') {
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
        windowName: event.currentTarget?.ownerDocument?.defaultView?.name,
        ...(callbacks?.removeFromContext ? { removeFromContext: callbacks.removeFromContext } : {}),
    });
};

export const updateCustomContextMenu = (items: any[]) => {
    items.map((el: any) => {
        registerContextMenuItems(new UnigraphObject(el).get('item_type')._value['unigraph.id'], [
            {
                text: new UnigraphObject(el).get('name').as('primitive') || '',
                icon: new UnigraphObject(el).get('icon')?.as('primitive') ? (
                    <ListItemIcon
                        style={{
                            minWidth: '19px',
                            minHeight: '19px',
                            backgroundImage: `url("data:image/svg+xml,${new UnigraphObject(el)
                                .get('icon')
                                ?.as('primitive')}")`,
                            opacity: 0.54,
                        }}
                    />
                ) : null,
                onClick: (uid, object, handleClose, callbacks, contextUid) => {
                    handleClose();
                    onDynamicContextMenu(el, uid, object, callbacks, contextUid);
                },
                shortcut: new UnigraphObject(el).get('is_shortcut')?.as('primitive') || false,
            } as UnigraphMenuItem,
        ]);
    });
};
