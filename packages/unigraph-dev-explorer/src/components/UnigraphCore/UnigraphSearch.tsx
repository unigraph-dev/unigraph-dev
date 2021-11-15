import { FormControlLabel, Switch, TextField } from "@material-ui/core"
import _ from "lodash";
import React from "react"
import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView";

export const parseQuery = (queryText: string) => {
    let currText = queryText;
    let finalQuery = [];

    let type_regex = /type:\$\/schema\/[a-zA-Z0-9_]*\b ?/gm;
    let types = currText.match(type_regex) || [];
    finalQuery.push(...types.map(tag => {return {method: "type", value: tag.slice(5).trim()}}));
    currText = currText.replace(type_regex, '');

    let uid_regex = /uid:[a-zA-Z0-9]*\b ?/gm;
    let uids = currText.match(uid_regex) || [];
    finalQuery.push(...uids.map(tag => {return {method: "uid", value: tag.slice(4).trim()}}));
    currText = currText.replace(uid_regex, '');


    return [{method: "fulltext", value: currText}, ...finalQuery];
}

export const SearchBar = ({onQueryUpdate, searchNow}: any) => {

    const [queryText, setQueryText] = React.useState('')

    React.useEffect(() => {
       onQueryUpdate(parseQuery(queryText));
    }, [queryText])

    return <div style={{display: "flex", flexDirection: "column", marginLeft: "16px", marginRight: "16px"}}>
        <TextField 
            id="search-box" 
            label="Search" 
            variant="outlined" 
            value={queryText} 
            onChange={(event) => {setQueryText(event?.target.value);}}
            onKeyDown={(ev) => { if (ev.code === "Enter") { searchNow(); } }} 
        />
    </div>
}

export const UnigraphSearch = ({id}: any) => {
    const [query, setQuery] = React.useState<any[]>([]);

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<string[]>([]);
    const [response, setResponse] = React.useState(false);
    const [showHidden, setShowHidden] = React.useState(false);

    const [loadedItems, setLoadedItems] = React.useState<any[]>([]);
    const [setupProps, setSetupProps] = React.useState<{next: any, cleanup: any} | null>(null);

    const search = React.useMemo(() => _.debounce((query: any[]) => {
        setResponse(false);
        if (query.length) {
            window.unigraph.getSearchResults(query, "metadata", 3, {noPrimitives: true}).then(res => {
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

    return <React.Fragment>
        <SearchBar onQueryUpdate={(newQuery: any[]) => {setQuery(newQuery)}} searchNow={() => search.flush()}/>
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
    </React.Fragment>
}