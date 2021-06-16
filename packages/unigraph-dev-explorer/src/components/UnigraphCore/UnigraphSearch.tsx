import { List, ListItem, TextField } from "@material-ui/core"
import React from "react"
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { debounce } from "../../utils"
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";

export const UnigraphSearch = () => {
    const [query, setQuery] = React.useState('');

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<any[]>([]);
    const [response, setResponse] = React.useState(false);

    const search = React.useMemo(() => debounce((query: string) => {
        setResponse(false);
        if (query.length) {
            window.unigraph.getSearchResults(query).then(res => {
                setResults(res.results);
                setEntities(res.entities);
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

    return <div>
        <TextField id="search-box" label="Search" value={query} onChange={(event) => {setQuery(event?.target.value)}}/>
        {response ? entities.length + " results" : []}
        <List style={{fontSize: "8px"}}>
            {buildGraph(entities).map((el: any) => 
                (el.type?.['unigraph.id'] && Object.keys(window.DynamicViews).includes(el.type?.['unigraph.id'])) ? <ListItem><AutoDynamicView object={el} /></ListItem> : []
            )}
        </List>
    </div>
}