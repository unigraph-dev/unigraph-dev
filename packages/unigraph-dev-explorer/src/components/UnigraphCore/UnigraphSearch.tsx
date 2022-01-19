import { FormControlLabel, Switch, TextField } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

export const parseQuery = (queryText: string) => {
    let currText = queryText;
    const finalQuery = [];

    const typeRegex = /type:\$\/schema\/[a-zA-Z0-9_]*\b ?/gm;
    const types = currText.match(typeRegex) || [];
    finalQuery.push(...types.map((tag) => ({ method: 'type', value: tag.slice(5).trim() })));
    currText = currText.replace(typeRegex, '');

    const uidRegex = /uid:[a-zA-Z0-9]*\b ?/gm;
    const uids = currText.match(uidRegex) || [];
    finalQuery.push(...uids.map((tag) => ({ method: 'uid', value: tag.slice(4).trim() })));
    currText = currText.replace(uidRegex, '');

    return [{ method: 'fulltext', value: currText }, ...finalQuery];
};

export function SearchBar({ onQueryUpdate, searchNow }: any) {
    const [queryText, setQueryText] = React.useState('');

    React.useEffect(() => {
        onQueryUpdate(parseQuery(queryText));
    }, [queryText]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '16px',
                marginRight: '16px',
            }}
        >
            <TextField
                id="search-box"
                label="Search"
                variant="outlined"
                value={queryText}
                onChange={(event) => {
                    setQueryText(event?.target.value);
                }}
                onKeyDown={(ev) => {
                    if (ev.code === 'Enter') {
                        searchNow();
                    }
                }}
            />
        </div>
    );
}

export function UnigraphSearch({ id }: any) {
    const [query, setQuery] = React.useState<any[]>([]);

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<string[]>([]);
    const [response, setResponse] = React.useState(false);
    const [showHidden, setShowHidden] = React.useState(false);

    const search = React.useMemo(
        () =>
            _.debounce((newQuery: any[]) => {
                setResponse(false);
                if (newQuery.length) {
                    window.unigraph
                        .getSearchResults(newQuery, 'metadata', 3, {
                            noPrimitives: true,
                            hideHidden: !showHidden,
                        })
                        .then((res) => {
                            // setResults(res.results.reverse());
                            setEntities(res.entities.reverse());
                            setResponse(true);
                        });
                } else {
                    setResults([]);
                    setEntities([]);
                }
            }, 500),
        [showHidden],
    );

    React.useEffect(() => {
        search(query);
    }, [query, showHidden]);

    return (
        <>
            <SearchBar
                onQueryUpdate={(newQuery: any[]) => {
                    setQuery(newQuery);
                }}
                searchNow={() => search.flush()}
            />
            <FormControlLabel
                control={<Switch checked={showHidden} onChange={() => setShowHidden(!showHidden)} name="showHidden" />}
                label="Show hidden items"
            />
            <DynamicObjectListView
                items={entities}
                context={null}
                defaultFilter={showHidden ? 'no-filter' : undefined}
                buildGraph
                subscribeOptions={{ depth: 12 }}
            />
        </>
    );
}
