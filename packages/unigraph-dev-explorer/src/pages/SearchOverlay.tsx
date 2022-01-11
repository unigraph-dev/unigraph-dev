import { Card, Divider, InputBase, TextField, Typography } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { AppState } from 'unigraph-dev-common/lib/types/unigraph';
import { buildUnigraphEntity } from 'unigraph-dev-common/lib/utils/entityUtils';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicView } from '../components/ObjectView/AutoDynamicView';
import { DynamicObjectListView } from '../components/ObjectView/DynamicObjectListView';
import { inlineTextSearch } from '../components/UnigraphCore/InlineSearchPopup';
import { parseQuery } from '../components/UnigraphCore/UnigraphSearch';
import { isElectron, setCaret } from '../utils';

const groups = [
    {
        title: 'Add an item',
        key: 'adder',
    },
    {
        title: 'Search Unigraph',
        key: 'search',
    },
    {
        title: 'Commands',
        key: undefined,
    },
];

function AdderComponent({ input, setInput, open, setClose, callback, summonerTooltip }: any) {
    const parsedKey = input.substr(1, input.indexOf(' ') - 1);
    const parsedValue = input.substr(input.indexOf(' ') + 1);
    const [toAdd, setToAdd] = React.useState<any>(null);
    const [adderRefs, setAdderRefs] = React.useState<any[]>([]);
    const tf = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        tf.current?.focus();
    }, [open]);

    React.useEffect(() => {
        const allAdders = window.unigraph.getState('registry/quickAdder').value;
        if (allAdders[parsedKey]) {
            allAdders[parsedKey].adder(parsedValue).then((res: any) => {
                const [object, type] = res;
                window.unigraph.getSchemas().then((schemas: any) => {
                    try {
                        const padded = buildUnigraphEntity(JSON.parse(JSON.stringify(object)), type, schemas);
                        setToAdd(
                            <div
                                onClickCapture={(ev) => {
                                    ev.stopPropagation();
                                }}
                            >
                                <AutoDynamicView
                                    object={new UnigraphObject(padded)}
                                    noDrag
                                    noDrop
                                    noClickthrough
                                    style={{
                                        border: 'gray',
                                        borderStyle: 'dashed',
                                        borderWidth: 'thin',
                                        margin: '2px',
                                        borderRadius: '8px',
                                        padding: '4px',
                                    }}
                                />
                            </div>,
                        );
                    } catch (e) {
                        console.log(e);
                    }
                });
            });
        }
    }, [input]);

    return (
        <div>
            <InputBase
                style={{ width: '100%' }}
                inputRef={tf}
                value={input}
                onChange={(ev) => {
                    const newContent = ev.target.value;
                    const caret = ev.target.selectionStart || 0;
                    const hasMatch = inlineTextSearch(
                        ev.target.value,
                        tf,
                        caret,
                        async (match: any, newName: string, newUid: string) => {
                            const newStr = `${newContent?.slice?.(0, match.index)}[[${newName}]]${newContent?.slice?.(
                                match.index + match[0].length,
                            )}`;
                            setInput(newStr);
                            setAdderRefs([...adderRefs, { key: newName, value: newUid }]);
                            window.unigraph.getState('global/searchPopup').setValue({ show: false });
                        },
                    );
                    if (!hasMatch) window.unigraph.getState('global/searchPopup').setValue({ show: false });
                    setInput(ev.target.value);
                }}
                onKeyPress={async (ev) => {
                    if (ev.key === 'Enter' && window.unigraph.getState('registry/quickAdder').value[parsedKey]) {
                        window.unigraph
                            .getState('registry/quickAdder')
                            .value[parsedKey]?.adder(
                                JSON.parse(JSON.stringify(parsedValue)),
                                false,
                                callback,
                                adderRefs,
                            )
                            .then((uids: any[]) => {
                                if (callback && uids[0]) callback(uids[0]);
                            });
                        setInput('');
                        setClose();
                    }
                }}
            />
            <div>
                {summonerTooltip ? <Typography>{summonerTooltip}</Typography> : []}
                <Typography>{`Adding ${parsedKey} (Enter to add)`}</Typography>
                {toAdd || []}
                <div style={{ marginTop: '32px' }}>
                    {window.unigraph.getState('registry/quickAdder').value[parsedKey]?.tooltip
                        ? React.createElement(window.unigraph.getState('registry/quickAdder').value[parsedKey]?.tooltip)
                        : []}
                </div>
            </div>
        </div>
    );
}

export function SearchOverlay({ open, setClose, callback, summonerTooltip, defaultValue }: any) {
    const [input, setInput] = React.useState(defaultValue || '');
    const [parsed, setParsed] = React.useState<any>({});
    const [query, setQuery] = React.useState<any[]>([]);

    const [entries, setEntries] = React.useState<any[]>([]);

    const [results, setResults] = React.useState<any[]>([]);
    const [entities, setEntities] = React.useState<string[]>([]);
    const [response, setResponse] = React.useState(false);
    const [commands, setCommands] = React.useState<any[]>([]);
    const [finalCommands, setFinalCommands] = React.useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const tf = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        window.unigraph.getState('registry/commands').subscribe((res) => {
            if (parsed.type !== 'command') {
                setCommands(res);
            }
        });
    });

    React.useEffect(() => {
        tf.current?.focus();
        console.log('open', open);
    }, [open]);

    React.useEffect(() => {
        if (typeof defaultValue === 'string') setInput(defaultValue);
    }, defaultValue);

    React.useEffect(() => {
        console.log(input);
        if (input.startsWith('?')) {
            const newQuery = input.slice(1);
            setParsed({
                type: 'query',
                value: newQuery,
            });
            setEntries([]);
            setEntities([]);
        } else {
            if (parsed.type === 'command' && input === '') {
                setCommands(window.unigraph.getState('registry/commands').value);
            }
            setParsed({
                type: input === '' ? '' : 'command',
                value: input,
            });
            setEntries([]);
            setEntities([]);
        }
        setSelectedIndex(0);
    }, [input]);

    React.useEffect(() => {
        const displayCommands = groups
            .map((grp: any) => [
                {
                    type: 'group',
                    element: <Typography style={{ color: 'gray' }}>{grp.title}</Typography>,
                },
                ...commands
                    .filter((el) => el.group === grp.key)
                    .map((el: any) => ({
                        type: 'command',
                        element: (
                            <div
                                onClick={(ev) => {
                                    el.onClick(ev, setInput, setClose);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                }}
                            >
                                <Typography style={{ flexGrow: 1 }}>{el.name}</Typography>
                                <Typography style={{ color: 'gray' }}>{el.about}</Typography>
                            </div>
                        ),
                    })),
            ])
            .flat();
        displayCommands
            .filter((el) => el.type === 'command')
            .forEach((el, index) => {
                Object.assign(el, { index });
            });
        setFinalCommands(displayCommands);
    }, [commands]);

    React.useEffect(() => {
        if (parsed?.type === 'query') {
            setQuery(parseQuery(parsed?.value));
        } else if (parsed?.type === 'command') {
            // list all commands
            const commandsVal = window.unigraph.getState('registry/commands').value;
            setCommands(
                commandsVal.filter(
                    (el: any) => (el.name as string).toLowerCase().includes(parsed.value.toLowerCase()) !== false,
                ),
            );
        }
    }, [parsed]);

    const search = React.useMemo(
        () =>
            _.debounce((newQuery: any[]) => {
                setResponse(false);
                if (newQuery.length) {
                    window.unigraph
                        .getSearchResults(newQuery, 'metadata', 3, {
                            noPrimitives: true,
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
            }, 200),
        [],
    );

    React.useEffect(() => {
        search(query);
    }, [query]);

    const defaultEl = (
        <div>
            <InputBase
                inputRef={tf}
                autoFocus
                style={{ width: '100%' }}
                value={input}
                onChange={(ev) => {
                    setInput(ev.target.value);
                }}
                onKeyDown={(ev) => {
                    console.log(ev);
                    if (ev.key === 'ArrowDown') {
                        console.log(ev);
                        setSelectedIndex((idx) => idx + 1);
                    } else if (ev.key === 'ArrowUp') {
                        setSelectedIndex((idx) => idx - 1);
                    } else if (ev.key === 'Enter') {
                        console.log(document.getElementById('omnibarItem_current') as any);
                        (document.getElementById('omnibarItem_current')?.children[0] as any)?.click();
                    } else return;
                    ev.preventDefault();
                    ev.stopPropagation();
                }}
                placeholder="Enter: +<type shortname> to create; ?<search query> to search; <command> to execute command"
            />
            <div>
                {summonerTooltip ? <Typography>{summonerTooltip}</Typography> : []}
                {entries}
                {entities.length > 0 ? <DynamicObjectListView items={entities} context={null} buildGraph noBar /> : []}
                {parsed?.type === 'command' || parsed?.type === ''
                    ? finalCommands.map((el) => (
                          <div
                              style={{
                                  backgroundColor: el.index === selectedIndex ? 'whitesmoke' : '',
                                  padding: '4px',
                                  borderRadius: '8px',
                              }}
                              id={`omnibarItem_${el.index === selectedIndex ? 'current' : ''}`}
                          >
                              {el.element}
                          </div>
                      ))
                    : []}
                <div />
            </div>
        </div>
    );
    console.log(window.unigraph.getState('registry/quickAdder').value[input.substr(1, input.indexOf(' ') - 1)]);
    return input.startsWith?.('+') &&
        window.unigraph.getState('registry/quickAdder').value[input.substr(1, input.indexOf(' ') - 1)] ? (
        <AdderComponent
            input={input}
            setInput={setInput}
            open={open}
            setClose={setClose}
            callback={callback}
            summonerTooltip={summonerTooltip}
        />
    ) : (
        defaultEl
    );
}

type OmnibarSummonerType = {
    show: boolean;
    tooltip: string;
    callback: any;
    defaultValue: string;
};

export function SearchOverlayPopover({ open, setClose, noShadow }: any) {
    const [searchEnabled, setSearchEnabled] = React.useState(false);
    const [summonerState, setSummonerState] = React.useState<Partial<OmnibarSummonerType>>({});
    const overlay = React.useRef(null);
    console.log(open, searchEnabled);

    const omnibarSummoner: AppState<Partial<OmnibarSummonerType>> = window.unigraph.getState('global/omnibarSummoner');

    React.useEffect(() => {
        setSearchEnabled(open);
    }, [open]);

    React.useEffect(() => {
        (window as any).showOmnibar = () => {
            setSearchEnabled(true);
        };
        omnibarSummoner.subscribe((v) => {
            setSummonerState(v);
        });
    }, []);

    React.useEffect(() => {
        if (summonerState?.show) setSearchEnabled(true);
        else setSearchEnabled(false);
    }, [summonerState]);

    React.useEffect(() => {
        if (searchEnabled) {
            const listener = (event: MouseEvent) => {
                const withinBoundaries = overlay && event.composedPath().includes((overlay as any).current);

                if (!withinBoundaries) {
                    setSearchEnabled(false);
                    document.removeEventListener('click', listener);
                }
            };
            document.addEventListener('click', listener);
        } else {
            if (omnibarSummoner.value?.show) {
                omnibarSummoner.setValue({});
            }
            if (setClose) setClose();
        }
        document.onkeydown = function (evt) {
            evt = evt || window.event;
            if ((evt.ctrlKey || evt.metaKey) && evt.key === 'e' && !isElectron()) {
                evt.preventDefault();
                if (open === undefined) setSearchEnabled(!searchEnabled);
            }
            if (searchEnabled && evt.key === 'Escape') {
                setSearchEnabled(false);
            }
        };
    }, [searchEnabled]);

    return (
        <Card
            elevation={noShadow ? 0 : 12}
            ref={overlay}
            style={{
                zIndex: 99,
                position: 'absolute',
                width: 'calc(100% - 128px)',
                maxWidth: '800px',
                left: 'max(64px, 50% - 400px)',
                top: '64px',
                maxHeight: '60%',
                overflow: 'auto',
                padding: '16px',
                borderRadius: '16px',
                display: searchEnabled ? 'block' : 'none',
            }}
        >
            <SearchOverlay
                open={searchEnabled}
                callback={summonerState.callback}
                summonerTooltip={summonerState.tooltip}
                defaultValue={summonerState.defaultValue}
                setClose={() => {
                    setSearchEnabled(false);
                }}
            />
        </Card>
    );
}
