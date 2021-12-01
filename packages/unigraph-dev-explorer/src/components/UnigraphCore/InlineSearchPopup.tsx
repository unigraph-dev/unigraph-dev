import { Divider, Popover, Typography } from "@material-ui/core"
import React from "react";
import { AppState } from "unigraph-dev-common/lib/types/unigraph";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { SearchPopupState } from "../../init";
import _ from "lodash";
import { parseQuery } from "./UnigraphSearch";

export const InlineSearch = () => {

    const ctxMenuState: AppState<Partial<SearchPopupState>> = window.unigraph.getState('global/searchPopup');

    const [state, setState] = React.useState(ctxMenuState.value);
    const search = React.useRef(_.throttle((key: string) => {
        if (key !== undefined && key.length > 1) 
            window.unigraph.getSearchResults(parseQuery(key as any) as any, "indexes", 3, {limit: -500, noPrimitives: true}).then((res: any) => {
                const results = res.entities.map((el: any) => { return {
                    name: (new UnigraphObject(el['unigraph.indexes']?.['name'] || {})).as('primitive'),
                    uid: el.uid,
                    type: el['type']['unigraph.id']
                }}).filter((el: any) => el.name);
                if (window.unigraph.getState('global/searchPopup').value.search === key) setSearchResults(results.reverse());
        });
    }, 300))

    const handleClose = () => ctxMenuState.setValue({show: false})

    React.useMemo(() => ctxMenuState.subscribe(v => setState(v)), []);

    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    React.useEffect(() => {if (!state.show) setSearchResults([]); search.current(state.search as string)}, [state])

    return <div><Popover
        id="context-menu-search"
        anchorReference="anchorEl"
        open={state.show!}
        anchorEl={state.anchorEl}
        onClose={handleClose}
        disableAutoFocus={true}
        disableEnforceFocus={true}
        anchorOrigin={{ 
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        PaperProps={{
            style: { maxHeight: '320px', padding: "8px" },
          }}
    >
        {state.default?.map(el => <React.Fragment>
            <Typography variant="body1"
                onClick={() => {
                    el.onSelected(state.search!).then((newUid: string) => {
                        state.onSelected?.(state.search!, newUid)
                    })
                }}
            >{el.label(state.search!)}</Typography>
        </React.Fragment>)}
        {searchResults.map((el: any) => <React.Fragment>
            <div onClick={() => {state.onSelected?.(el.name, el.uid)}}>
                
                <div style={{display: "inline-flex"}}>
                    <div style={{minHeight: "18px", minWidth: "18px", height: "18px", width: "18px", alignSelf: "center", marginRight: "3px", opacity: 0.54, backgroundImage: `url("data:image/svg+xml,${(window.unigraph.getNamespaceMap)?.()?.[el.type]?._icon}")`}}/>
                    <Typography style={{color: "grey", marginLeft: "2px"}}>{(window.unigraph.getNamespaceMap)?.()?.[el.type]?._name}</Typography>
                    <Divider variant="middle" orientation="vertical" style={{height: "16px", alignSelf: "center"}} />
                    <Typography variant="body1">{el.name}</Typography>
                </div>
            </div>
        </React.Fragment>)}
    </Popover></div>
}