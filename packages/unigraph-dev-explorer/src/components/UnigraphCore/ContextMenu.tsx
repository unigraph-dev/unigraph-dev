import { Divider, ListItemText, ListItemIcon, MenuItem, Popover, Typography, MenuList } from "@material-ui/core"
import React from "react"
import { AppState } from "unigraph-dev-common/lib/types/unigraph";
import { ContextMenuState } from "../../init"
import { deselectUid } from "../../utils";

import Icon from '@mdi/react'
import { mdiCubeOutline, mdiDatabaseOutline, mdiRelationManyToMany } from '@mdi/js';

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
        <MenuList>
        <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} >
            <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiCubeOutline} size={1}/></ListItemIcon>
            <ListItemText>{state.contextUid}</ListItemText>
            <ListItemIcon style={{minWidth: "36px", marginLeft: "12px"}}><Icon path={mdiDatabaseOutline} size={1}/></ListItemIcon>
            <ListItemText>{state.contextObject?.type?.['unigraph.id']}</ListItemText>
        </MenuItem>
        <Divider/>
        {state.menuContent?.map(el => el(state.contextUid!, state.contextObject, handleClose, state.callbacks, state.contextContextUid))}
        {schemaMenuConstructors.length > 0 ? <React.Fragment>
            <Divider/>
            {schemaMenuConstructors.map((el: any) => el(state.contextUid!, state.contextObject, handleClose, {...state.callbacks, removeFromContext: state.removeFromContext}, state.contextContextUid))}
        </React.Fragment> : []}
        {state.contextContextUid ? <React.Fragment>
            <Divider/>
            <MenuItem style={{paddingTop: "2px", paddingBottom: "2px"}} >
                <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiRelationManyToMany} size={1}/></ListItemIcon>
                <ListItemText>{state.contextContextUid}</ListItemText>
                <ListItemIcon style={{minWidth: "36px"}}><Icon path={mdiDatabaseOutline} size={1}/></ListItemIcon>
                <ListItemText>{state.contextContextObject?.type?.['unigraph.id']}</ListItemText>
            </MenuItem>
            <Divider/>
            {state.menuContextContent?.map(el => el(state.contextUid!, state.contextObject, handleClose, {...state.callbacks, removeFromContext: state.removeFromContext}, state.contextContextUid))}
        </React.Fragment>: []}
        {state.extraContent ? state.extraContent(handleClose) : []}
        </MenuList>
    </Popover></div>
}