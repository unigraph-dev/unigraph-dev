import { Divider, ListItemText, ListItemIcon, MenuItem, Popover, Typography, styled } from '@mui/material';
import React from 'react';
import { AppState } from 'unigraph-dev-common/lib/types/unigraph';
import Icon from '@mdi/react';
import { mdiCubeOutline, mdiDatabaseOutline, mdiPentagonOutline } from '@mdi/js';
import { ContextMenuState } from '../../global.d';
import { contextMenuItemStyle, deselectUid, getName, isDeveloperMode } from '../../utils';
import { UnigraphMenuItem } from '../ObjectView/DefaultObjectContextMenu';

export const ctxMenuFont = {
    fontSize: '14px',
    fontFamily:
        'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
};

const ItemDescriptorDeveloper = ({ uid, object, objectType }: any) => {
    const objDef = window.unigraph.getNamespaceMap?.()?.[objectType];

    return (
        <MenuItem style={contextMenuItemStyle}>
            <ListItemIcon style={{ minWidth: '19px', paddingRight: '12px' }}>
                <Icon path={mdiCubeOutline} size={0.8} />
            </ListItemIcon>
            <ContextMenuListItemText>{uid}</ContextMenuListItemText>
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
                <ListItemIcon style={{ minWidth: '19px', paddingLeft: '4px', paddingRight: '8px' }}>
                    <Icon path={mdiDatabaseOutline} size={1} />
                </ListItemIcon>
            )}
            <ContextMenuListItemText>{objDef?._name || objectType}</ContextMenuListItemText>
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
            <Typography
                style={{
                    flexGrow: 0,
                    color: 'var(--secondary-text-color)',
                    ...ctxMenuFont,
                }}
            >
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
            <Typography
                style={{
                    maxWidth: '200px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    ...ctxMenuFont,
                }}
            >
                {getName(object) || 'unnamed'}
            </Typography>
        </MenuItem>
    );
};

const ContextMenuListItemText = styled(ListItemText)(({ theme }: any) => ({
    [`& .MuiListItemText-primary`]: ctxMenuFont,
}));

const defaultIcon = (
    <ListItemIcon style={{ minWidth: '19px' }}>
        <Icon path={mdiPentagonOutline} size={0.8} />
    </ListItemIcon>
);

export const UnigraphContextMenuItem = ({
    data,
    uid,
    object,
    handleClose,
    callbacks,
    contextUid,
}: {
    data: UnigraphMenuItem;
    uid: string;
    object: Record<string, any>;
    handleClose: () => void;
    callbacks: Record<string, any>;
    // eslint-disable-next-line react/require-default-props
    contextUid?: string;
}) => {
    return (
        <MenuItem
            style={contextMenuItemStyle}
            onClick={() => data.onClick(uid, object, handleClose, callbacks, contextUid)}
        >
            <div style={{ lineHeight: 0, paddingRight: '12px' }}>{data.icon || defaultIcon}</div>
            <ContextMenuListItemText>{data.text}</ContextMenuListItemText>
            {data.secondary ? (
                <Typography variant="body2" color="text.secondary" style={ctxMenuFont}>
                    {data.secondary}
                </Typography>
            ) : null}
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
            ...(window.unigraph.getState('registry/contextMenu').value['$/schema/any'] || []),
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
                open={state.show! && (state.windowName === undefined || window.name === state.windowName)}
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
                        backgroundColor: '#f8f8f8',
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
                    {state.menuContent?.map((el: any) => (
                        <UnigraphContextMenuItem
                            data={el}
                            uid={state.contextUid!}
                            object={state.contextObject}
                            handleClose={handleClose}
                            callbacks={state.callbacks}
                            contextUid={state.contextContextUid}
                        />
                    ))}
                    {schemaMenuConstructors !== null && schemaMenuConstructors.length > 0 ? (
                        <>
                            <Divider sx={{ margin: '4px 0px !important' }} />
                            {schemaMenuConstructors.map((el: any) => (
                                <UnigraphContextMenuItem
                                    data={el}
                                    uid={state.contextUid!}
                                    object={state.contextObject}
                                    handleClose={handleClose}
                                    callbacks={{
                                        ...state.callbacks,
                                        removeFromContext: state.removeFromContext,
                                    }}
                                    contextUid={state.contextContextUid}
                                />
                            ))}
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
                            {state.menuContextContent?.map((el: any) => (
                                <UnigraphContextMenuItem
                                    data={el}
                                    uid={state.contextUid!}
                                    object={state.contextObject}
                                    handleClose={handleClose}
                                    callbacks={{
                                        ...state.callbacks,
                                        removeFromContext: state.removeFromContext,
                                    }}
                                    contextUid={state.contextContextUid}
                                />
                            ))}
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
