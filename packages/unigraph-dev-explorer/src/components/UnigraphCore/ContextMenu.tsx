import { Divider, ListItemText, ListItemIcon, MenuItem, Popover } from '@material-ui/core';
import React from 'react';
import { AppState } from 'unigraph-dev-common/lib/types/unigraph';
import Icon from '@mdi/react';
import { mdiCubeOutline, mdiDatabaseOutline } from '@mdi/js';
import { ContextMenuState } from '../../global.d';
import { deselectUid } from '../../utils';

export function ContextMenu() {
    const ctxMenuState: AppState<Partial<ContextMenuState>> = window.unigraph.getState('global/contextMenu');

    const [state, setState] = React.useState(ctxMenuState.value);
    const thisRef = React.useRef(null);

    const handleClose = () => {
        deselectUid();
        ctxMenuState.setValue({ show: false });
    };
    const schemaMenuConstructors = [
        ...(window.unigraph.getState('registry/contextMenu').value[state.contextObject?.type?.['unigraph.id']] || []),
        ...(state.schemaMenuContent || []),
    ];

    React.useMemo(() => ctxMenuState.subscribe((v) => setState(v)), []);

    const objDef = window.unigraph.getNamespaceMap?.()?.[state.contextObject?.type?.['unigraph.id']];
    const objCtxDef = window.unigraph.getNamespaceMap?.()?.[state.contextContextObject?.type?.['unigraph.id']];

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
                        padding: '6px 4px',
                        borderRadius: '16px',
                    },
                }}
            >
                <div>
                    <MenuItem style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                        <ListItemIcon style={{ minWidth: '32px' }}>
                            <Icon path={mdiCubeOutline} size={0.8} />
                        </ListItemIcon>
                        <ListItemText>{state.contextUid}</ListItemText>
                        {objDef?._icon ? (
                            <ListItemIcon
                                style={{
                                    minWidth: '20px',
                                    minHeight: '20px',
                                    marginLeft: '12px',
                                    marginRight: '8px',
                                    backgroundImage: `url("data:image/svg+xml,${objDef?._icon}")`,
                                    opacity: 0.54,
                                }}
                            />
                        ) : (
                            <ListItemIcon style={{ minWidth: '36px', marginLeft: '12px' }}>
                                <Icon path={mdiDatabaseOutline} size={1} />
                            </ListItemIcon>
                        )}
                        <ListItemText>{objDef?._name || state.contextObject?.type?.['unigraph.id']}</ListItemText>
                    </MenuItem>
                    <Divider />
                    {state.menuContent?.map((el: any) =>
                        el(
                            state.contextUid!,
                            state.contextObject,
                            handleClose,
                            state.callbacks,
                            state.contextContextUid,
                        ),
                    )}
                    {schemaMenuConstructors.length > 0 ? (
                        <>
                            <Divider />
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
                            <Divider />
                            <MenuItem
                                style={{
                                    paddingTop: '2px',
                                    paddingBottom: '2px',
                                }}
                            >
                                <ListItemIcon style={{ minWidth: '32px' }}>
                                    <Icon path={mdiCubeOutline} size={0.8} />
                                </ListItemIcon>
                                <ListItemText>{state.contextContextUid}</ListItemText>
                                {objCtxDef?._icon ? (
                                    <ListItemIcon
                                        style={{
                                            minWidth: '20px',
                                            minHeight: '20px',
                                            marginLeft: '12px',
                                            marginRight: '8px',
                                            backgroundImage: `url("data:image/svg+xml,${objCtxDef?._icon}")`,
                                            opacity: 0.54,
                                        }}
                                    />
                                ) : (
                                    <ListItemIcon
                                        style={{
                                            minWidth: '32px',
                                            marginLeft: '12px',
                                        }}
                                    >
                                        <Icon path={mdiDatabaseOutline} size={0.8} />
                                    </ListItemIcon>
                                )}
                                <ListItemText>
                                    {objCtxDef?._name || state.contextContextObject?.type?.['unigraph.id']}
                                </ListItemText>
                            </MenuItem>
                            <Divider />
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
