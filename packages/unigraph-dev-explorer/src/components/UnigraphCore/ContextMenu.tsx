import { Divider, Popover, Typography } from "@material-ui/core"
import React from "react"
import { AppState } from "unigraph-dev-common/lib/types/unigraph";
import { ContextMenuState } from "../../init"
import { deselectUid } from "../../utils";

export const ContextMenu = () => {

    const ctxMenuState: AppState<Partial<ContextMenuState>> = window.unigraph.getState('global/contextMenu');

    const [state, setState] = React.useState(ctxMenuState.value);
    const thisRef = React.useRef(null);

    const handleClose = () => {
        deselectUid();
        ctxMenuState.setValue({show: false})
    };
    const schemaMenuConstructors = [...(window.unigraph.getState('registry/contextMenu').value[state.contextObject?.['type']?.['unigraph.id']] || []), ...(state.schemaMenuContent || [])];

    React.useMemo(() => ctxMenuState.subscribe(v => setState(v)), []);

    return <div ref={thisRef}><Popover
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
    >
        {state.menuContent?.map(el => el(state.contextUid!, state.contextObject, handleClose, state.callbacks))}
        {schemaMenuConstructors.length > 0 ? <React.Fragment>
            <Divider/>
            {schemaMenuConstructors.map((el: any) => el(state.contextUid!, state.contextObject, handleClose, {...state.callbacks, removeFromContext: state.removeFromContext}))}
        </React.Fragment> : []}
        {state.contextContextUid ? <React.Fragment>
            <Divider/>
            <Typography variant="body1" style={{padding: "8px"}}>Context uid: {state.contextContextUid}; type: {state.contextContextObject?.type?.['unigraph.id']}</Typography>
            <Divider/>
            {state.menuContextContent?.map(el => el(state.contextUid!, state.contextObject, handleClose, {...state.callbacks, removeFromContext: state.removeFromContext}))}
        </React.Fragment>: []}
        {state.extraContent ? state.extraContent(handleClose) : []}
    </Popover></div>
}