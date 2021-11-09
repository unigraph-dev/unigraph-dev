import { FormControlLabel, List, ListItem, Switch, TextField, Typography } from "@material-ui/core"
import _ from "lodash";
import React from "react"
import InfiniteScroll from "react-infinite-scroll-component";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";
import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView";
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
            window.unigraph.getSearchResults([{method: 'fulltext', value: query}], "metadata", 3).then(res => {
                //setResults(res.results.reverse());
                setEntities(res.entities.reverse());
                setResponse(true);
            })
        } else {
            setResults([]);
            setEntities([]);
        }
    }, 500), [])

    React.useEffect(() => {
        search(query)
    }, [query])

    const dynamicViews = window.unigraph.getState('registry/dynamicView').value

    return <div id={"scrollableDiv" + id} style={{height: "100%"}}>
        <div style={{display: "flex", flexDirection: "column", marginLeft: "16px", marginRight: "16px"}}>
            <TextField id="search-box" label="Search" variant="outlined" value={query} onChange={(event) => {setQuery(event?.target.value);}}
                onKeyDown={(ev) => { if (ev.code === "Enter") { search.flush(); } }} />
        </div>
        <FormControlLabel
            control={<Switch checked={showHidden} onChange={() => setShowHidden(!showHidden)} name={"showHidden"} />}
            label={"Show items without a view"}
        />
        <DynamicObjectListView 
            items={entities}
            context={null}
            defaultFilter={showHidden ? "no-filter" : undefined}
            buildGraph={true}
        />
    </div>
}