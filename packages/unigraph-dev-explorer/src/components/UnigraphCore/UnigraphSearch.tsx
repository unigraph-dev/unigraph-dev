import { List, ListItem, TextField, Typography } from "@material-ui/core"
import _ from "lodash";
import React from "react"
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";

export const UnigraphSearch = () => {
    const [query, setQuery] = React.useState('');

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<any[]>([]);
    const [response, setResponse] = React.useState(false);

    const search = React.useMemo(() => _.debounce((query: string) => {
        setResponse(false);
        if (query.length) {
            window.unigraph.getSearchResults(query, "fulltext").then(res => {
                //setResults(res.results.reverse());
                setEntities(res.entities.reverse());
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

    const dynamicViews = window.unigraph.getState('registry/dynamicView').value

    return <div>
        <div style={{display: "flex", flexDirection: "column", marginLeft: "16px", marginRight: "16px"}}>
            <TextField id="search-box" label="Search" variant="outlined" value={query} onChange={(event) => {setQuery(event?.target.value);}}
                onKeyDown={(ev) => { if (ev.code === "Enter") { search.flush(); } }} />
        </div>
        <Typography variant="body1" style={{marginLeft: "16px", marginTop: "8px", marginBottom: "8px"}}>{response ? entities.length + " results" : "Press Enter to search"}</Typography>
        <List style={{fontSize: "8px"}}>
            {buildGraph(entities).map((el: any) => 
                (el.type?.['unigraph.id'] && Object.keys(dynamicViews).includes(el.type?.['unigraph.id'])) ? <ListItem><AutoDynamicView object={el} /></ListItem> : []
            )}
        </List>
    </div>
}