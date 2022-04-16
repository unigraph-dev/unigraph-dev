import { Divider, Popover, Typography } from '@mui/material';
import React from 'react';
import { AppState } from 'unigraph-dev-common/lib/types/unigraph';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import _ from 'lodash';
import Levenshtein from 'levenshtein';
import { parseQuery } from './UnigraphSearch';
import { setSearchPopup } from '../../examples/notes/searchPopup';
import { SearchPopupState } from '../../global.d';

const ResultDisplay = ({ el }: any) => {
    return (
        <div style={{ display: 'inline-flex' }}>
            <div
                style={{
                    minHeight: '18px',
                    minWidth: '18px',
                    height: '18px',
                    width: '18px',
                    alignSelf: 'center',
                    marginRight: '3px',
                    opacity: 0.54,
                    backgroundImage: `url("data:image/svg+xml,${
                        window.unigraph.getNamespaceMap?.()?.[el.type]?._icon
                    }")`,
                }}
            />
            <Typography style={{ color: 'var(--secondary-text-color)', marginLeft: '2px' }}>
                {window.unigraph.getNamespaceMap?.()?.[el.type]?._name}
            </Typography>
            <Divider
                variant="middle"
                orientation="vertical"
                style={{
                    height: '16px',
                    alignSelf: 'center',
                    marginLeft: '16px',
                    marginRight: '16px',
                    marginTop: '0px',
                    marginBottom: '0px',
                }}
            />
            <Typography variant="body1">{el.name}</Typography>
        </div>
    );
};

export function InlineSearch() {
    const [isFulltext, setIsFulltext] = React.useState(false);
    const [ctxMenuState, setCtxMenuState] = React.useState<AppState<Partial<SearchPopupState>>>(
        window.unigraph.getState('global/searchPopup'),
    );
    const [state, setState] = React.useState<Partial<SearchPopupState>>(
        window.unigraph.getState('global/searchPopup').value,
    );

    React.useEffect(() => {
        setState(ctxMenuState.value);
        ctxMenuState.subscribe((v) => setState(v));
    }, [ctxMenuState]);
    //

    const [currentAction, setCurrentAction] = React.useState(0);

    const titleSearch = (key: string) => {
        const names = (window.unigraph as any).getCache('searchTitles');
        const results = (names || []).filter((el: any) => el?.name?.toLowerCase().includes(key?.toLowerCase().trim()));
        if (key?.length)
            setTopResults(
                results
                    .filter((it: any) => it.incoming >= 5)
                    .sort((a: any, b: any) => b.incoming - a.incoming)
                    .slice(0, 10),
            );

        setSearchResults(
            results
                .sort((a: any, b: any) => new Date(b._updatedAt || 0).getTime() - new Date(a._updatedAt || 0).getTime())
                .slice(0, 100),
        );
    };
    const search = React.useCallback(
        _.debounce((key: string) => {
            if (key !== undefined && key.length > 1) {
                window.unigraph
                    .getSearchResults(parseQuery(key as any) as any, 'name', 2, {
                        hideHidden: state.hideHidden,
                    })
                    .then((res: any) => {
                        const resultsTop = res.top
                            .filter((el: any) => el.type['unigraph.id'] !== '$/schema/embed_block')
                            .map((el: any) => ({
                                name: new UnigraphObject(el['unigraph.indexes']?.name || {}).as('primitive'),
                                uid: el.uid,
                                type: el.type['unigraph.id'],
                            }))
                            .filter((el: any) => el.name);
                        const results = res.entities
                            .filter((el: any) => el.type['unigraph.id'] !== '$/schema/embed_block')
                            .map((el: any) => ({
                                name: new UnigraphObject(el['unigraph.indexes']?.name || {}).as('primitive'),
                                uid: el.uid,
                                type: el.type['unigraph.id'],
                            }))
                            .filter((el: any) => el.name);
                        if (window.unigraph.getState('global/searchPopup').value.search === key) {
                            setSearchResults(results);
                            setTopResults(resultsTop);
                        }
                    });
            }
        }, 200),
        [state],
    );

    const handleClose = React.useCallback(() => ctxMenuState.setValue({ show: false }), [ctxMenuState]);

    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [topResults, setTopResults] = React.useState<any[]>([]);
    React.useEffect(() => {
        if (!state.show) {
            setSearchResults([]);
            setTopResults([]);
            setIsFulltext(false);
        } else setCurrentAction(0);
        (isFulltext ? search : titleSearch)(state.search as string);
    }, [state.show, state.search, isFulltext]);

    const [actionItems, setActionItems] = React.useState<any[]>([]);
    React.useEffect(() => {
        setActionItems(
            [
                ...(state.default || []).map((el: any, index: number) => [
                    <Typography variant="body1">{el.label(state.search!)}</Typography>,
                    (ev: any) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        el.onSelected(state.search!).then(([newUid, newType]: [string, string]) => {
                            state.onSelected?.(state.search!, newUid, newType);
                        });
                    },
                    'default',
                ]),
                ...topResults.map((el: any) => [
                    <ResultDisplay el={el} />,
                    (ev: any) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        state.onSelected?.(el.name, el.uid, el.type);
                    },
                    'top',
                ]),
                ...searchResults.map((el: any) => [
                    <ResultDisplay el={el} />,
                    (ev: any) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        state.onSelected?.(el.name, el.uid, el.type);
                    },
                    'recent',
                ]),
            ].map((el: any, index: number) => [...el, index]),
        );
    }, [searchResults, topResults, state]);

    React.useEffect(() => {
        if (topResults.length > 0 && topResults[0]?.name.toLowerCase().includes(state.search?.toLowerCase()))
            setCurrentAction((ca: number) => Math.max(ca, (state.default || []).length));
    }, [topResults, (state?.default || []).length]);

    React.useEffect(() => {
        const handler = (ev: any) => {
            if (ctxMenuState.value.show && ev.key === 'ArrowDown' && currentAction < actionItems.length) {
                ev.preventDefault();
                ev.stopPropagation();
                setCurrentAction((ca) => ca + 1);
            } else if (ctxMenuState.value.show && ev.key === 'ArrowUp' && currentAction > 0) {
                ev.preventDefault();
                ev.stopPropagation();
                setCurrentAction((ca) => ca - 1);
            } else if (ctxMenuState.value.show && ev.key === 'Enter') {
                ev.preventDefault();
                ev.stopPropagation();
                actionItems[currentAction]?.[1]?.(ev);
            } else if (ctxMenuState.value.show && ev.key === 'Escape') {
                ev.preventDefault();
                ev.stopPropagation();
                ctxMenuState.setValue({ show: false });
            } else if (ev.key === 'f' && (ev.ctrlKey || ev.metaKey)) {
                ev.preventDefault();
                ev.stopPropagation();
                setIsFulltext((ft: any) => !ft);
            }
        };

        document.addEventListener('keydown', handler, { capture: true });

        return function cleanup() {
            document.removeEventListener('keydown', handler, { capture: true });
        };
    }, [currentAction, actionItems]);

    return (
        <div>
            <Popover
                id="context-menu-search"
                anchorReference="anchorEl"
                open={state.show!}
                anchorEl={state.anchorEl}
                onClose={handleClose}
                disableAutoFocus
                disableEnforceFocus
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    elevation: 4,
                    style: {
                        maxHeight: '320px',
                        maxWidth: '600px',
                        padding: '0px',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <div style={{ overflowX: 'auto', padding: '8px' }}>
                    {Object.entries(_.groupBy(actionItems, (el: any) => el[2])).map(([key, value]) => {
                        return (
                            <>
                                {key === 'default' ? (
                                    []
                                ) : (
                                    <Typography style={{ color: 'darkgray', marginTop: '4px' }}>
                                        {key === 'top'
                                            ? `${isFulltext ? 'Top linked' : 'Relevant'}`
                                            : 'Recently updated'}
                                    </Typography>
                                )}
                                {value.map((el: any, index: number) => (
                                    <div
                                        onClick={el[1]}
                                        style={{
                                            ...(el[3] === currentAction
                                                ? {
                                                      borderRadius: '2px',
                                                      backgroundColor: 'gainsboro',
                                                  }
                                                : {}),
                                            cursor: 'pointer',
                                            padding: '2px',
                                        }}
                                        id={`globalSearchItem_${el[3] === currentAction ? 'current' : ''}`}
                                    >
                                        {el[0]}
                                    </div>
                                ))}
                            </>
                        );
                    })}
                </div>
                <div
                    style={{
                        backgroundColor: 'var(--app-drawer-background-color)',
                        padding: '8px',
                    }}
                >
                    <Typography variant="body2" style={{ color: 'var(--secondary-text-color)' }}>
                        <kbd>⌘</kbd>+<kbd>F</kbd> {!isFulltext ? 'Fulltext' : 'Title-only'} search
                        <kbd style={{ marginLeft: '16px' }}>↑</kbd>/<kbd>↓</kbd> Navigate
                        <kbd style={{ marginLeft: '16px' }}>Enter</kbd> Link text
                    </Typography>
                </div>
            </Popover>
        </div>
    );
}

/**
 * Refactor notes
 * domEl => boxRef
 *
 */
export const inlineTextSearch = (
    newText: string,
    domEl: any,
    caret: number,
    onMatch: any,
    hideHidden = true,
    matchOnly = false,
) => {
    let hasMatch = false;
    const placeholder = /\[\[([^[\]]*)\]\]/g;
    for (let match: any; (match = placeholder.exec(newText)) !== null; ) {
        if (match.index + 2 <= caret && placeholder.lastIndex - 2 >= caret) {
            hasMatch = true;
            // inputDebounced.cancel();
            if (!matchOnly) setSearchPopup(domEl, match[1], onMatch.bind(this, match), hideHidden);
        }
    }
    return hasMatch;
};

export const inlineObjectSearch = (
    newText: string,
    domEl: any,
    caret: number,
    onMatch: any,
    hideHidden = true,
    matchOnly = false,
) => {
    let hasMatch = false;
    const placeholder = /\(\(([^[\)]*)\)\)/g;
    for (let match: any; (match = placeholder.exec(newText)) !== null; ) {
        if (match.index + 2 <= caret && placeholder.lastIndex - 2 >= caret) {
            hasMatch = true;
            // inputDebounced.cancel();
            if (!matchOnly) setSearchPopup(domEl, match[1], onMatch.bind(this, match), hideHidden);
        }
    }
    return hasMatch;
};

export const inlineRefsToChildren = (refs?: any[]) =>
    (refs || []).map((ref) => ({
        type: {
            'unigraph.id': '$/schema/interface/semantic',
        },
        $parentcontext: {
            _key: ref.key ? `[[${ref.key}]]` : undefined,
        },
        _value: { uid: ref.value },
    }));
