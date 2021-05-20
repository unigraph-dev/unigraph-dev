import { List, TextField } from "@material-ui/core"
import React from "react"
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { debounce } from "../../utils"
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";

export const UnigraphSearch = () => {
    const [query, setQuery] = React.useState('');

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<any[]>([]);

    const search = React.useMemo(() => debounce((query: string) => {
        if (query.length) {
            window.unigraph.getSearchResults(query).then(res => {
                setResults(res.results);
                setEntities(res.entities);
            })
        } else {
            setResults([]);
            setEntities([]);
        }
    }, 200), [])

    React.useEffect(() => {
        search(query)
    }, [query])

    return <div>
        <TextField id="search-box" label="Search" value={query} onChange={(event) => {setQuery(event?.target.value)}}/>
        {query ? entities.length + " results" : []}
        <List>
            {buildGraph(entities).map((el: any) => <React.Fragment>
                {(el.type?.['unigraph.id'] && Object.keys(window.DynamicViews).includes(el.type?.['unigraph.id'])) ? <AutoDynamicView object={el} /> : []}
            </React.Fragment>)}
        </List>
    </div>
}