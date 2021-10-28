import { FormControlLabel, List, ListItem, Switch, TextField, Typography } from "@material-ui/core"
import _ from "lodash";
import React from "react"
import InfiniteScroll from "react-infinite-scroll-component";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";
import { setupInfiniteScrolling } from "../ObjectView/infiniteScrolling";

export const UnigraphSearch = ({id}: any) => {
    const [query, setQuery] = React.useState('');

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<string[]>([]);
    const [response, setResponse] = React.useState(false);
    const [showHidden, setShowHidden] = React.useState(false);

    const [loadedItems, setLoadedItems] = React.useState<any[]>([]);
    const [setupProps, setSetupProps] = React.useState<{next: any, cleanup: any} | null>(null);

    const search = React.useMemo(() => _.debounce((query: string) => {
        setResponse(false);
        if (query.length) {
            window.unigraph.getSearchResults(query, "fulltext", "uids", 3).then(res => {
                //setResults(res.results.reverse());
                setEntities(res.entities.reverse().map(el => el.uid));
                setResponse(true);
            })
        } else {
            setResults([]);
            setEntities([]);
        }
    }, 1000), [])

    React.useEffect(() => {
        search(query)
    }, [query])

    React.useEffect(() => {
        if (setupProps?.cleanup) setupProps.cleanup();
        if (entities.length) {
            const newProps = setupInfiniteScrolling(entities, 25, (items: any[]) => {
                setLoadedItems(items);
            });
            setSetupProps(newProps);
            newProps.next();
        } else {setLoadedItems([])};

        return function cleanup () { setupProps?.cleanup() }
    }, [entities])

    const dynamicViews = window.unigraph.getState('registry/dynamicView').value

    return <div id={"scrollableDiv" + id}>
        <div style={{display: "flex", flexDirection: "column", marginLeft: "16px", marginRight: "16px"}}>
            <TextField id="search-box" label="Search" variant="outlined" value={query} onChange={(event) => {setQuery(event?.target.value);}}
                onKeyDown={(ev) => { if (ev.code === "Enter") { search.flush(); } }} />
        </div>
        <FormControlLabel
            control={<Switch checked={showHidden} onChange={() => setShowHidden(!showHidden)} name={"showHidden"} />}
            label={"Show items without a view"}
        />
        <Typography variant="body1" style={{marginLeft: "16px", marginTop: "8px", marginBottom: "8px"}}>{response ? entities.length + " results" : "Press Enter to search"}</Typography>
        <InfiniteScroll
            dataLength={loadedItems.length}
            next={setupProps?.next || (() => {})}
            hasMore={loadedItems.length < entities.length}
            loader={<React.Fragment/>}
            endMessage={
                <React.Fragment/>
            }
            scrollableTarget={"workspaceContainer" + id}
        >
            {buildGraph(loadedItems).map((el: any) => 
                (el.type?.['unigraph.id'] && (Object.keys(dynamicViews).includes(el.type?.['unigraph.id'])) || showHidden) ? <ListItem><AutoDynamicView object={el} /></ListItem> : []
            )}
        </InfiniteScroll>
    </div>
}