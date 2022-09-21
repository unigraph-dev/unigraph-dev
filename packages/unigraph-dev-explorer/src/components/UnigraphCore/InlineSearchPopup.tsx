import { Divider, Popover, Typography } from '@mui/material';
import React from 'react';
import { AppState } from 'unigraph-dev-common/lib/types/unigraph';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import _ from 'lodash';
import Levenshtein from 'levenshtein';
import { parseQuery } from './UnigraphSearch';
import { setSearchPopup } from '../../examples/notes/searchPopup';
import { SearchPopupState } from '../../global.d';
import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';
import { isLargeScreen } from '../../utils';
import { quickTitleSearch } from '../../utils/titleSearch';

export const ResultDisplay = ({ el }: any) => {
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

export function InlineSearch({ window }: any) {
    if (!window) window = document.defaultView;
    const [isFulltext, setIsFulltext] = React.useState(false);
    const [ctxMenuState, setCtxMenuState] = React.useState<AppState<Partial<SearchPopupState>>>(
        window.unigraph.getState('global/searchPopup'),
    );
    const [state, setState] = React.useState<Partial<SearchPopupState>>(
        window.unigraph.getState('global/searchPopup').value,
    );

    // TODO: Temporarily disable preview by default until we fix it
    const [previewEnabled, setPreviewEnabled] = React.useState<boolean>(false /*! !ctxMenuState.value.preview */);

    React.useEffect(() => {
        setState(ctxMenuState.value);
        ctxMenuState.subscribe((v) => setState(v));
    }, [ctxMenuState]);
    //

    const [currentAction, setCurrentAction] = React.useState(0);

    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [topResults, setTopResults] = React.useState<any[]>([]);

    const titleSearch = (key: string) => {
        quickTitleSearch(
            key,
            (res, isTop) => (isTop ? setTopResults(res) : setSearchResults(res)),
            20,
            key?.length ? 100 : 20,
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
                    el,
                ]),
                ...topResults.map((el: any) => [
                    <ResultDisplay el={el} />,
                    (ev: any) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        state.onSelected?.(el.name, el.uid, el.type);
                    },
                    'top',
                    el,
                ]),
                ...searchResults.map((el: any) => [
                    <ResultDisplay el={el} />,
                    (ev: any) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        state.onSelected?.(el.name, el.uid, el.type);
                    },
                    'recent',
                    el,
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
            } else if (ev.key === 'p' && (ev.ctrlKey || ev.metaKey)) {
                ev.preventDefault();
                ev.stopPropagation();
                setPreviewEnabled((pv: any) => !pv);
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
                open={state.show! && (state.windowName === undefined || window.name === state.windowName)}
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
                        maxHeight: '536px',
                        padding: '0px',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowX: 'hidden',
                    },
                }}
            >
                <div style={{ display: 'flex', overflowX: 'hidden', height: '100%', width: '100%' }}>
                    <div style={{ overflowX: 'auto', padding: '8px', maxWidth: '600px', flexGrow: 1 }}>
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
                                                ...(el[4] === currentAction
                                                    ? {
                                                          borderRadius: '2px',
                                                          backgroundColor: 'gainsboro',
                                                      }
                                                    : {}),
                                                cursor: 'pointer',
                                                padding: '2px',
                                            }}
                                            id={`globalSearchItem_${el[4] === currentAction ? 'current' : ''}`}
                                        >
                                            {el[0]}
                                        </div>
                                    ))}
                                </>
                            );
                        })}
                    </div>
                    {previewEnabled && isLargeScreen() ? (
                        <>
                            <Divider flexItem variant="middle" orientation="vertical" />
                            <div style={{ width: '500px', minHeight: '500px', overflowY: 'auto' }}>
                                {actionItems[currentAction]?.[3]?.uid ? (
                                    <AutoDynamicViewDetailed
                                        object={{
                                            uid: actionItems[currentAction]?.[3]?.uid,
                                            type: { 'unigraph.id': actionItems[currentAction]?.[3]?.type },
                                            _stub: true,
                                        }}
                                        key={actionItems[currentAction]?.[3]?.uid}
                                    />
                                ) : (
                                    '...'
                                )}
                            </div>
                        </>
                    ) : null}
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
                        <kbd style={{ marginLeft: '16px' }}>⌘</kbd>+<kbd>P</kbd> {!previewEnabled ? 'Show' : 'Hide'}{' '}
                        preview
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
