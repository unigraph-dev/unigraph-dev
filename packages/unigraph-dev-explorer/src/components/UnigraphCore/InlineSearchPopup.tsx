import { Divider, Popover, Typography } from "@material-ui/core"
import React from "react";
import { AppState } from "unigraph-dev-common/lib/types/unigraph";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { SearchPopupState } from "../../init";
import _ from "lodash";
import { parseQuery } from "./UnigraphSearch";

export const InlineSearch = () => {

    const ctxMenuState: AppState<Partial<SearchPopupState>> = window.unigraph.getState('global/searchPopup');

    const [currentAction, setCurrentAction] = React.useState(0);
    const keyDownRef = React.useRef((ev: any) => {
            console.log(ev);
            if (ev.key === "ArrowDown") {
                ev.preventDefault();
                ev.stopPropagation();
                setCurrentAction(currentAction + 1);
            }
        })

    const [state, setState] = React.useState(ctxMenuState.value);
    const search = React.useRef(_.throttle((key: string) => {
        if (key !== undefined && key.length > 1) 
            window.unigraph.getSearchResults(parseQuery(key as any) as any, "indexes", 2, {limit: -500, noPrimitives: true, hideHidden: ctxMenuState.value.hideHidden}).then((res: any) => {
                const results = res.entities.map((el: any) => { return {
                    name: (new UnigraphObject(el['unigraph.indexes']?.['name'] || {})).as('primitive'),
                    uid: el.uid,
                    type: el['type']['unigraph.id']
                }}).filter((el: any) => el.name);
                if (window.unigraph.getState('global/searchPopup').value.search === key) setSearchResults(results.reverse());
        });
    }, 500))

    const handleClose = () => ctxMenuState.setValue({show: false})

    React.useEffect(() => ctxMenuState.subscribe(v => setState(v)), []);

    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    React.useEffect(() => {if (!state.show) setSearchResults([]); else setCurrentAction(0); search.current(state.search as string)}, [state])

    const [actionItems, setActionItems] = React.useState<any[]>([]);
    React.useEffect(() => {
        setActionItems([
            ...(state.default || []).map((el, index) => [<React.Fragment>
                <Typography variant="body1">{el.label(state.search!)}</Typography>
            </React.Fragment>, (ev: any) => {
                        console.log("Yo")
                        ev.preventDefault();
                        ev.stopPropagation();
                        el.onSelected(state.search!).then((newUid: string) => {
                            state.onSelected?.(state.search!, newUid)
                        })
                    }]), 
            ...searchResults.map((el: any) => [<React.Fragment>
                    <div style={{display: "inline-flex"}}>
                        <div style={{minHeight: "18px", minWidth: "18px", height: "18px", width: "18px", alignSelf: "center", marginRight: "3px", opacity: 0.54, backgroundImage: `url("data:image/svg+xml,${(window.unigraph.getNamespaceMap)?.()?.[el.type]?._icon}")`}}/>
                        <Typography style={{color: "grey", marginLeft: "2px"}}>{(window.unigraph.getNamespaceMap)?.()?.[el.type]?._name}</Typography>
                        <Divider variant="middle" orientation="vertical" style={{height: "16px", alignSelf: "center"}} />
                        <Typography variant="body1">{el.name}</Typography>
                </div>
            </React.Fragment>, (ev: any) => {console.log("Yo"); ev.preventDefault(); ev.stopPropagation(); state.onSelected?.(el.name, el.uid)}])
        ])
    }, [searchResults, state])

    React.useEffect(() => {
        document.addEventListener('keydown', (ev) => {
            if (ctxMenuState.value.show && ev.key === "ArrowDown") {
                console.log("D")
                ev.preventDefault();
                ev.stopPropagation();
                setCurrentAction(currentAction => currentAction + 1);
            } else if (ctxMenuState.value.show && ev.key === "ArrowUp") {
                ev.preventDefault();
                ev.stopPropagation();
                setCurrentAction(currentAction => currentAction - 1);
            } else if (ctxMenuState.value.show && ev.key === "Enter") {
                ev.preventDefault();
                ev.stopPropagation();
                console.log(document.getElementById("globalSearchItem_current"))
                document.getElementById("globalSearchItem_current")?.click();
            } else if (ctxMenuState.value.show && ev.key === "Escape") {
                ev.preventDefault();
                ev.stopPropagation();
                ctxMenuState.setValue({show: false})
            }
        }, {capture: true})
    }, [])

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
            style: { maxHeight: '320px', padding: "8px", borderRadius: "8px" },
          }}
    >
        {actionItems.map((el: any, index: number) => <div onMouseDown={el[1]} onClick={el[1]} style={index === currentAction ? {borderRadius: "6px", backgroundColor: "gainsboro", }: {}} id={"globalSearchItem_" + (index === currentAction ? "current" : "")}>
            {el[0]}
        </div>)}
    </Popover></div>
}