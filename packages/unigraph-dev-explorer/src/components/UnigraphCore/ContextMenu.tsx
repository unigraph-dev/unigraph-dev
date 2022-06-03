import { Divider, ListItemText, ListItemIcon, MenuItem, Popover, Typography } from '@mui/material';
import React from 'react';
import { AppState } from 'unigraph-dev-common/lib/types/unigraph';
import Icon from '@mdi/react';
import { mdiCubeOutline, mdiDatabaseOutline } from '@mdi/js';
import { ContextMenuState } from '../../global.d';
import { contextMenuItemStyle, deselectUid, getName, isDeveloperMode } from '../../utils';

const ItemDescriptorDeveloper = ({ uid, object, objectType }: any) => {
    const objDef = window.unigraph.getNamespaceMap?.()?.[objectType];

    return (
        <MenuItem style={contextMenuItemStyle}>
            <ListItemIcon style={{ minWidth: '32px' }}>
                <Icon path={mdiCubeOutline} size={0.8} />
            </ListItemIcon>
            <ListItemText>{uid}</ListItemText>
            <Divider
                variant="middle"
                orientation="vertical"
                flexItem
                style={{
                    height: '16px',
                    alignSelf: 'center',
                    marginLeft: '16px',
                    marginRight: '16px',
                    marginTop: '0px',
                    marginBottom: '0px',
                }}
            />
            {objDef?._icon ? (
                <ListItemIcon
                    style={{
                        minWidth: '19px',
                        minHeight: '19px',
                        marginRight: '8px',
                        backgroundImage: `url("data:image/svg+xml,${objDef?._icon}")`,
                        opacity: 0.54,
                    }}
                />
            ) : (
                <ListItemIcon style={{ minWidth: '32px' }}>
                    <Icon path={mdiDatabaseOutline} size={1} />
                </ListItemIcon>
            )}
            <ListItemText>{objDef?._name || objectType}</ListItemText>
        </MenuItem>
    );
};

const ItemDescriptorNormal = ({ uid, object, objectType }: any) => {
    const objDef = window.unigraph.getNamespaceMap?.()?.[objectType];

    return (
        <MenuItem style={contextMenuItemStyle}>
            <ListItemIcon
                style={{
                    minWidth: '16px',
                    minHeight: '16px',
                    marginRight: '6px',
                    backgroundImage: objDef?._icon ? `url("data:image/svg+xml,${objDef?._icon}")` : '',
                    opacity: 0.54,
                }}
            />
            <Typography style={{ flexGrow: 0, color: 'var(--secondary-text-color)' }}>
                {objDef?._name || objectType}
            </Typography>
            <Divider
                variant="middle"
                orientation="vertical"
                flexItem
                style={{
                    height: '16px',
                    alignSelf: 'center',
                    marginLeft: '8px',
                    marginRight: '8px',
                    marginTop: '0px',
                    marginBottom: '0px',
                }}
            />
            <Typography style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {getName(object) || 'unnamed'}
            </Typography>
        </MenuItem>
    );
};

export function ContextMenu({ window }: any) {
    if (!window) window = document.defaultView;
    const thisRef = React.useRef(null);

    const [ctxMenuState, setCtxMenuState] = React.useState<AppState<Partial<ContextMenuState>>>(
        window.unigraph.getState('global/contextMenu'),
    );
    const [state, setState] = React.useState<Partial<ContextMenuState>>(
        window.unigraph.getState('global/contextMenu').value,
    );

    React.useEffect(() => {
        setState(ctxMenuState.value);
        ctxMenuState.subscribe((v) => setState(v));
    }, [ctxMenuState]);

    const [schemaMenuConstructors, setSchemaMenuConstructors] = React.useState<any>(null);
    const ItemDescriptor = isDeveloperMode() ? ItemDescriptorDeveloper : ItemDescriptorNormal;

    React.useEffect(() => {
        setSchemaMenuConstructors([
            ...(window.unigraph.getState('registry/contextMenu').value[state.contextObject?.type?.['unigraph.id']] ||
                []),
            ...(state.schemaMenuContent || []),
        ]);
    }, [state]);

    const handleClose = React.useCallback(() => {
        deselectUid();
        ctxMenuState.setValue({ show: false });
    }, [ctxMenuState]);

    return (
        <div ref={thisRef}>
            <Popover
                id="context-menu"
                anchorReference="anchorPosition"
                open={state.show! && window.name === state.windowName}
                anchorPosition={state.anchorPosition}
                onClose={handleClose}
                container={thisRef.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    elevation: 4,
                    style: {
                        padding: '4px 4px',
                        borderRadius: '6px',
                    },
                }}
            >
                <div>
                    <ItemDescriptor
                        uid={state.contextUid}
                        objectType={state.contextObject?.type?.['unigraph.id']}
                        object={state.contextObject}
                    />
                    <Divider sx={{ margin: '4px 0px !important' }} />
                    {state.menuContent?.map((el: any) =>
                        el(
                            state.contextUid!,
                            state.contextObject,
                            handleClose,
                            state.callbacks,
                            state.contextContextUid,
                        ),
                    )}
                    {schemaMenuConstructors !== null && schemaMenuConstructors.length > 0 ? (
                        <>
                            <Divider sx={{ margin: '4px 0px !important' }} />
                            {schemaMenuConstructors.map((el: any) =>
                                el(
                                    state.contextUid!,
                                    state.contextObject,
                                    handleClose,
                                    {
                                        ...state.callbacks,
                                        removeFromContext: state.removeFromContext,
                                    },
                                    state.contextContextUid,
                                ),
                            )}
                        </>
                    ) : (
                        []
                    )}
                    {state.contextContextUid ? (
                        <>
                            <Divider sx={{ margin: '4px 0px !important' }} />
                            <ItemDescriptor
                                uid={state.contextContextUid}
                                objectType={state.contextContextObject?.type?.['unigraph.id']}
                                object={state.contextContextObject}
                            />
                            <Divider sx={{ margin: '4px 0px !important' }} />
                            {state.menuContextContent?.map((el: any) =>
                                el(
                                    state.contextUid!,
                                    state.contextObject,
                                    handleClose,
                                    {
                                        ...state.callbacks,
                                        removeFromContext: state.removeFromContext,
                                    },
                                    state.contextContextUid,
                                ),
                            )}
                        </>
                    ) : (
                        []
                    )}
                    {state.extraContent
                        ? state.extraContent(state.contextUid!, state.contextObject, handleClose, {
                              ...state.callbacks,
                              removeFromContext: state.removeFromContext,
                          })
                        : []}
                </div>
            </Popover>
        </div>
    );
}
