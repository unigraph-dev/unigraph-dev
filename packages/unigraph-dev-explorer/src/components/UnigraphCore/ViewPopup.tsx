import { Container, CssBaseline, Popover } from '@mui/material';
import _ from 'lodash';
import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../utils';

export function ViewPopup({ window }: any) {
    if (!window) window = document.defaultView;
    const [ctxMenuState, setCtxMenuState] = React.useState<any>(window.unigraph.getState('global/viewPopup'));
    const [state, setState] = React.useState<any>(window.unigraph.getState('global/viewPopup').value);

    React.useEffect(() => {
        setState(ctxMenuState.value);
        ctxMenuState.subscribe((v: any) => setState(v));
    }, [ctxMenuState]);

    const [id, setId] = React.useState(0);
    React.useEffect(() => {
        if (state.show) setId(getRandomInt());
        else setId(0);
    }, [state]);

    const handleClose = React.useCallback(() => ctxMenuState.setValue({ show: false }), [ctxMenuState]);
    const tabCtx = React.useMemo(
        () => ({
            viewId: id,
            setTitle: () => undefined,
            setMaximize: () => false,
            isVisible: () => true,
            subscribeToType(name: any, callback: any, eventId?: any, options?: any) {
                return window.unigraph.subscribeToType(name, callback, eventId, options);
            },
            subscribeToObject(uid: any, callback: any, eventId?: any, options?: any) {
                window.unigraph.subscribeToObject(uid, callback, eventId, options);
            },
            subscribeToQuery(fragment: any, callback: any, eventId?: any, options?: any) {
                window.unigraph.subscribeToQuery(fragment, callback, eventId, options);
            },
            subscribe(query: any, callback: any, eventId?: any, update?: any) {
                window.unigraph.subscribe(query, callback, eventId, update);
            },
            unsubscribe(subsId: any) {
                window.unigraph.unsubscribe(subsId);
            },
        }),
        [id],
    );

    return (
        <div>
            <Popover
                style={{ zIndex: 1000 }}
                id="view-popup"
                anchorReference="anchorPosition"
                open={state.show && (state.windowName === undefined || window.name === state.windowName)}
                anchorPosition={state.anchorPosition}
                onClose={handleClose}
                disableAutoFocus
                disableEnforceFocus
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    elevation: 4,
                    style: {
                        maxHeight: '536px',
                        maxWidth: '600px',
                        padding: '0px',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowX: 'hidden',
                    },
                }}
            >
                <TabContext.Provider value={tabCtx}>
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'auto',
                            paddingTop: '0px',
                        }}
                        id={`workspaceFrame${id}`}
                        className="workspace-frame workspace-frame-popup"
                    >
                        <CssBaseline />
                        {state.pageName
                            ? window.unigraph.getState('registry/pages').value[state.pageName].constructor(state.config)
                            : []}
                    </div>
                </TabContext.Provider>
            </Popover>
        </div>
    );
}
