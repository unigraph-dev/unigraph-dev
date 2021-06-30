import { Divider, Popover, Typography } from "@material-ui/core"
import React from "react"
import { AppState } from "unigraph-dev-common/lib/types/unigraph";
import { ContextMenuState } from "../../init"

export const ContextMenu = () => {

    const ctxMenuState: AppState<Partial<ContextMenuState>> = window.unigraph.getState('global/contextMenu');

    const [state, setState] = React.useState(ctxMenuState.value);

    const handleClose = () => ctxMenuState.setValue({show: false})

    React.useMemo(() => ctxMenuState.subscribe(v => setState(v)), []);

    return <div><Popover
        id="context-menu"
        anchorReference="anchorPosition"
        open={state.show!}
        anchorPosition={state.anchorPosition}
        onClose={handleClose}
        anchorOrigin={{ 
            vertical: 'bottom',
            horizontal: 'center',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
    >
        <Typography variant="body1" style={{padding: "8px"}}>Object uid: {state.contextUid}; type: {state.contextObject?.type?.['unigraph.id']}</Typography>
        <Divider />
        {state.menuContent?.map(el => el(state.contextUid!, state.contextObject, handleClose))}
        {state.contextContextUid ? <React.Fragment>
            <Divider/>
            <Typography variant="body1" style={{padding: "8px"}}>Context uid: {state.contextContextUid}; type: {state.contextContextObject?.type?.['unigraph.id']}</Typography>
            <Divider/>
            {state.menuContextContent?.map(el => el(state.contextUid!, state.contextObject, handleClose, {removeFromContext: state.removeFromContext}))}
        </React.Fragment>: []}
    </Popover></div>
}