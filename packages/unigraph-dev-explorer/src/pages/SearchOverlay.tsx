import { Card, Divider, InputBase, TextField, Typography } from "@material-ui/core";
import _ from "lodash";
import React from "react"
import { buildUnigraphEntity } from "unigraph-dev-common/lib/utils/entityUtils";
import { UnigraphObject } from "unigraph-dev-common/lib/utils/utils";
import { AutoDynamicView } from "../components/ObjectView/AutoDynamicView";
import { DynamicObjectListView } from "../components/ObjectView/DynamicObjectListView";
import { parseQuery } from "../components/UnigraphCore/UnigraphSearch";

export const SearchOverlayTooltip = () => {
    return <div style={{marginTop: "16px"}}>
        <Typography style={{color: "gray"}}>Add an item</Typography>
        <Typography>+todo / +td : add todo item</Typography>
        <Typography>+note / +n : create new note page and start editing</Typography>
        <Typography>+bookmark / +bm : add bookmark from URL</Typography>
        <Typography style={{color: "gray"}}>Search Unigraph</Typography>
        <Typography>?&lt;search query&gt; : search Unigraph</Typography>
    </div>
}

export const SearchOverlay = ({open, setClose}: any) => {
    const tf = React.useRef<HTMLDivElement | null>(null);
    const [input, setInput] = React.useState("");
    const [parsed, setParsed] = React.useState<any>({});
    const [query, setQuery] = React.useState<any[]>([]);

    const [entries, setEntries] = React.useState<any[]>([]);

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<string[]>([]);
    const [response, setResponse] = React.useState(false);

    React.useEffect(() => { 
        tf.current?.focus();
    }, [open])

    React.useEffect(() => {
        if (input.startsWith("+")) {
            const quickAdder = input.substr(1, input.indexOf(' ')-1);
            const value = input.substr(input.indexOf(' ')+1);
            const allAdders = window.unigraph.getState('registry/quickAdder').value;
            if (allAdders[quickAdder]) setParsed({
                type: "quickAdder",
                key: quickAdder,
                value: value
            }); else {
                setParsed({});
                setEntries([]);
                setEntities([]);
            }
        } else if (input.startsWith('?')) {
            const query = input.slice(1);
            setParsed({
                type: "query",
                value: query
            });
            setEntries([]);
            setEntities([]);
        } else {
            setParsed({
                type: "command",
                value: input
            });
            setEntries([]);
            setEntities([]);
        }
    }, [input])

    React.useEffect(() => {
        if (parsed?.type === "quickAdder") {
            const allAdders = window.unigraph.getState('registry/quickAdder').value;
            allAdders[parsed?.key].adder(parsed?.value).then((res: any) => {
                const [object, type] = res;
                console.log(JSON.stringify(object))
                window.unigraph.getSchemas().then((schemas: any) => {
                    try {
                        const padded = buildUnigraphEntity(JSON.parse(JSON.stringify(object)), type, schemas)
                        setEntries([<AutoDynamicView object={new UnigraphObject(padded)} noDrag noDrop/>])
                    } catch (e) {
                        console.log(e)
                    }
                })
            });
        } else if (parsed?.type === "query") {
            setQuery(parseQuery(parsed?.value));
        }
    }, [parsed])

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
    }, 200), [])

    React.useEffect(() => {
        search(query)
    }, [query])

    return <div>
        <InputBase
            style={{width: "100%"}}
            inputRef={tf}
            value={input}
            onChange={(ev) => {
                setInput(ev.target.value);
            }}
            placeholder={"Enter: +<type shortname> to create; ?<search query> to search; <command> to execute command"}
            onKeyPress={async (ev) => {
                if (ev.key === "Enter" && parsed?.type === "quickAdder" && window.unigraph.getState('registry/quickAdder').value[parsed?.key]) {
                    await window.unigraph.getState('registry/quickAdder').value[parsed?.key]?.adder(JSON.parse(JSON.stringify(parsed?.value)), false);
                    setInput('');
                    setClose();
                }
            }}
        />
        <div>
            {parsed?.type === "quickAdder" ? <Typography>
                {"Adding " + parsed?.key + " (Enter to add)"}
            </Typography> : []}
            {entries}
            {entities.length > 0 ? <DynamicObjectListView 
                items={entities}
                context={null}
                buildGraph={true}
                noBar
            /> : []}
            {entries.length + entities.length === 0 ? <SearchOverlayTooltip /> : []}
            {parsed?.type === "quickAdder" ? <div style={{marginTop: "32px"}}>
                {React.createElement(window.unigraph.getState('registry/quickAdder').value[parsed?.key].tooltip)}
            </div> : []}
        </div>
    </div>
}

export const SearchOverlayPopover = ({open, setClose, noShadow}: any) => {
    const [searchEnabled, setSearchEnabled] = React.useState(false);
    const overlay = React.useRef(null);

    React.useEffect(() => {
        document.onkeydown = function(evt) {
            evt = evt || window.event;
            if ((evt.ctrlKey || evt.metaKey) && evt.key === 'e') {
                if (open === undefined) setSearchEnabled(!searchEnabled);
            }
            if ((open || searchEnabled) && evt.key === 'Escape') {
                setClose ? setClose() : setSearchEnabled(false);
            }
        };
    }, [searchEnabled])

    React.useEffect(() => {
        if (open || searchEnabled) {
            const listener = (event: MouseEvent) => {
                const withinBoundaries = overlay && event.composedPath().includes((overlay as any).current)
                
                if (!withinBoundaries) {
                    setClose ? setClose() : setSearchEnabled(false);
                    document.removeEventListener('click', listener)
                } 
            }
            document.addEventListener('click', listener)
        }
    }, [searchEnabled])

    return <Card
    elevation={noShadow ? 0 : 12} 
        style={{
            zIndex: 99,
            position: "absolute",
            width: "calc(100% - 128px)",
            maxWidth: "800px",
            left: "max(64px, 50% - 400px)",
            "top": "64px",
            "maxHeight": "60%",
            overflow: "auto",
            "padding": "16px",
            "borderRadius": "16px",
            display: (open || searchEnabled) ? "block" : "none"
        }}
        ref={overlay}
    >
        <SearchOverlay open={open || searchEnabled} setClose={setClose || (() => setSearchEnabled(false))}/>
    </Card>
}