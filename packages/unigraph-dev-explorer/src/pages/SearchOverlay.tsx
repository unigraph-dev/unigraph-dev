import { Card, Divider, InputBase, TextField, Typography } from "@material-ui/core";
import _ from "lodash";
import React from "react"
import { AppState } from "unigraph-dev-common/lib/types/unigraph";
import { buildUnigraphEntity } from "unigraph-dev-common/lib/utils/entityUtils";
import { UnigraphObject } from "unigraph-dev-common/lib/utils/utils";
import { AutoDynamicView } from "../components/ObjectView/AutoDynamicView";
import { DynamicObjectListView } from "../components/ObjectView/DynamicObjectListView";
import { inlineTextSearch } from "../components/UnigraphCore/InlineSearchPopup";
import { parseQuery } from "../components/UnigraphCore/UnigraphSearch";
import { isElectron, setCaret } from "../utils";

export const SearchOverlayTooltip = () => {
    return <div style={{marginTop: "16px"}}>
        <Typography style={{color: "gray"}}>Add an item</Typography>
        <Typography>+todo / +td : add todo item</Typography>
        <Typography>+note / +n : create new note page and start editing</Typography>
        <Typography>+bookmark / +bm : add bookmark from URL</Typography>
        <Typography style={{color: "gray"}}>Search Unigraph</Typography>
        <Typography>?&lt;search query&gt; : search Unigraph</Typography>
        <Typography style={{color: "gray"}}>Commands</Typography>
    </div>
}

export const SearchOverlay = ({open, setClose, callback, summonerTooltip, defaultValue}: any) => {
    const tf = React.useRef<HTMLDivElement | null>(null);
    const [input, setInput] = React.useState(defaultValue || "");
    const [parsed, setParsed] = React.useState<any>({});
    const [query, setQuery] = React.useState<any[]>([]);

    const [entries, setEntries] = React.useState<any[]>([]);

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<string[]>([]);
    const [response, setResponse] = React.useState(false);
    const [commands, setCommands] = React.useState<any[]>([]);

    const [adderRefs, setAdderRefs] = React.useState<any[]>([]);

    React.useEffect(() => {
        window.unigraph.getState("registry/commands").subscribe(res => {
            if (parsed.type !== "command") {
                setCommands(res);
            }
        })
    })

    React.useEffect(() => { 
        tf.current?.focus();
    }, [open])

    React.useEffect(() => {
        if (typeof defaultValue === "string") setInput(defaultValue);
    }, defaultValue)

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
            if (parsed.type === "command" && input === "") {
                setCommands(window.unigraph.getState("registry/commands").value)
            }
            setParsed({
                type: input === "" ? "" : "command",
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
                        setEntries([<div onClickCapture={(ev) => { ev.stopPropagation();}}>
                            <AutoDynamicView object={new UnigraphObject(padded)} noDrag noDrop/>
                        </div>])
                    } catch (e) {
                        console.log(e)
                    }
                })
            });
        } else if (parsed?.type === "query") {
            setQuery(parseQuery(parsed?.value));
        } else if (parsed?.type === "command") {
            // list all commands
            const commands = window.unigraph.getState("registry/commands").value;
            setCommands(commands.filter((el: any) => (el.name as string).toLowerCase().includes(parsed.value.toLowerCase()) !== false))
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
                const newContent = ev.target.value;
                const caret = ev.target.selectionStart || 0;
                inlineTextSearch(ev.target.value, tf, caret, async (match: any, newName: string, newUid: string) => {
                    const newStr = newContent?.slice?.(0, match.index) + '[[' + newName + ']]' + newContent?.slice?.(match.index + match[0].length);
                    setInput(newStr);
                    setAdderRefs([...adderRefs, {key: newName, value: newUid}]);
                    window.unigraph.getState('global/searchPopup').setValue({ show: false });
                })
                setInput(ev.target.value);
            }}
            placeholder={"Enter: +<type shortname> to create; ?<search query> to search; <command> to execute command"}
            onKeyPress={async (ev) => {
                if (ev.key === "Enter" && parsed?.type === "quickAdder" && window.unigraph.getState('registry/quickAdder').value[parsed?.key]) {
                    window.unigraph.getState('registry/quickAdder').value[parsed?.key]?.adder(JSON.parse(JSON.stringify(parsed?.value)), false, callback, adderRefs).then((uids: any[]) => {
                        if (callback && uids[0]) callback(uids[0])
                    });
                    setInput('');
                    setClose();
                }
            }}
        />
        <div>
            {summonerTooltip ? <Typography>{summonerTooltip}</Typography> : []}
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
            {entries.length + entities.length === 0 && parsed?.type !== "command" ? <SearchOverlayTooltip /> : []}
            {(parsed?.type === "command" || parsed?.type === "") ? commands.map((el: any) => <div onClick={() => {
                el.onClick();
                setInput(''); setClose();
            }} style={{display: "flex", marginTop: "8px", marginBottom: "8px", cursor: "pointer"}}>
                <Typography style={{flexGrow: 1}}>{el.name}</Typography>
                <Typography style={{color: "gray"}}>{el.about}</Typography>
            </div>) : []}
            {parsed?.type === "quickAdder" ? <div style={{marginTop: "32px"}}>
                {React.createElement(window.unigraph.getState('registry/quickAdder').value[parsed?.key].tooltip)}
            </div> : []}
            <div>

            </div>
        </div>
    </div>
}

type OmnibarSummonerType = {
    show: boolean,
    tooltip: string,
    callback: any,
    defaultValue: string
}

export const SearchOverlayPopover = ({open, setClose, noShadow}: any) => {
    const [searchEnabled, setSearchEnabled] = React.useState(false);
    const [summonerState, setSummonerState] = React.useState<Partial<OmnibarSummonerType>>({});
    const overlay = React.useRef(null);
    console.log(open, searchEnabled)

    const omnibarSummoner: AppState<Partial<OmnibarSummonerType>> = window.unigraph.getState('global/omnibarSummoner');

    React.useEffect(() => {
        setSearchEnabled(open);
    }, [open])
    
    React.useEffect(() => {
        (window as any).showOmnibar = () => {
            setSearchEnabled(true);
        }
        omnibarSummoner.subscribe((v) => {
            setSummonerState(v);
        });
    }, [])

    React.useEffect(() => {
        if (summonerState?.show) setSearchEnabled(true);
        else setSearchEnabled(false);
    }, [summonerState])

    React.useEffect(() => {
        if (searchEnabled) {
            const listener = (event: MouseEvent) => {
                const withinBoundaries = overlay && event.composedPath().includes((overlay as any).current)
                
                if (!withinBoundaries) {
                    setSearchEnabled(false);
                    document.removeEventListener('click', listener)
                } 
            }
            document.addEventListener('click', listener)
        } else {
            if (omnibarSummoner.value?.show) {
                omnibarSummoner.setValue({});
            }
            if (setClose) setClose();
        }
        document.onkeydown = function(evt) {
            evt = evt || window.event;
            if ((evt.ctrlKey || evt.metaKey) && evt.key === 'e' && !isElectron()) {
                evt.preventDefault();
                if (open === undefined) setSearchEnabled(!searchEnabled);
            }
            if ((searchEnabled) && evt.key === 'Escape') {
                setSearchEnabled(false);
            }
        };
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
            display: (searchEnabled) ? "block" : "none"
        }}
        ref={overlay}
    >
        <SearchOverlay 
            open={searchEnabled} callback={summonerState.callback} 
            summonerTooltip={summonerState.tooltip} defaultValue={summonerState.defaultValue}
            setClose={(() => {setSearchEnabled(false);})}/>
    </Card>
}