import { Popover, Typography } from "@material-ui/core"
import React from "react";
import { AppState } from "unigraph-dev-common/lib/types/unigraph";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { SearchPopupState } from "../../init";

export const InlineSearch = () => {

    const ctxMenuState: AppState<Partial<SearchPopupState>> = window.unigraph.getState('global/searchPopup');

    const [state, setState] = React.useState(ctxMenuState.value);

    const handleClose = () => ctxMenuState.setValue({show: false})

    React.useMemo(() => ctxMenuState.subscribe(v => setState(v)), []);

    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    React.useEffect(() => {
        if (state.search !== undefined && state.search.length > 1) window.unigraph.getSearchResults((state.search as string), "fulltext", "indexes").then((res: any) => {
            const results = res.entities.map((el: any) => { return {
                name: (new UnigraphObject(el['unigraph.indexes']?.['name'] || {})).as('primitive'),
                uid: el.uid,
                type: el['type']['unigraph.id']
            }}).filter((el: any) => el.name);
            setSearchResults(results);
        });
    }, [state])

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
    >
        {state.default?.map(el => <Typography variant="body1"
            onClick={() => {
                el.onSelected(state.search!).then((newUid: string) => {
                    state.onSelected?.(state.search!, newUid)
                })
            }}
        >{el.label(state.search!)}</Typography>)}
        {searchResults.map((el: any) => <Typography variant="body1"
            onClick={() => {state.onSelected?.(el.name, el.uid)}}
        >{el.name} - {el.type}</Typography>)}
    </Popover></div>
}