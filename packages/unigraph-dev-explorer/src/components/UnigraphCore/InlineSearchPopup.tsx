import { Divider, Popover, Typography } from '@material-ui/core';
import React from 'react';
import { AppState } from 'unigraph-dev-common/lib/types/unigraph';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import _ from 'lodash';
import { parseQuery } from './UnigraphSearch';
import { setSearchPopup } from '../../examples/notes/searchPopup';
import { SearchPopupState } from '../../global.d';

export function InlineSearch() {
    const ctxMenuState: AppState<Partial<SearchPopupState>> = window.unigraph.getState('global/searchPopup');

    const [currentAction, setCurrentAction] = React.useState(0);
    const keyDownRef = React.useRef((ev: any) => {
        console.log(ev);
        if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            ev.stopPropagation();
            setCurrentAction(currentAction + 1);
        }
    });

    const [state, setState] = React.useState(ctxMenuState.value);
    const search = React.useRef(
        _.throttle((key: string) => {
            if (key !== undefined && key.length > 1) {
                window.unigraph
                    .getSearchResults(parseQuery(key as any) as any, 'indexes', 2, {
                        limit: -500,
                        noPrimitives: true,
                        hideHidden: ctxMenuState.value.hideHidden,
                    })
                    .then((res: any) => {
                        const results = res.entities
                            .map((el: any) => ({
                                name: new UnigraphObject(el['unigraph.indexes']?.name || {}).as('primitive'),
                                uid: el.uid,
                                type: el.type['unigraph.id'],
                            }))
                            .filter((el: any) => el.name);
                        if (window.unigraph.getState('global/searchPopup').value.search === key)
                            setSearchResults(results.reverse());
                    });
            }
        }, 500),
    );

    const handleClose = () => ctxMenuState.setValue({ show: false });

    React.useEffect(() => ctxMenuState.subscribe((v) => setState(v)), []);

    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    React.useEffect(() => {
        if (!state.show) setSearchResults([]);
        else setCurrentAction(0);
        search.current(state.search as string);
    }, [state]);

    const [actionItems, setActionItems] = React.useState<any[]>([]);
    React.useEffect(() => {
        setActionItems([
            ...(state.default || []).map((el: any, index: number) => [
                <Typography variant="body1">{el.label(state.search!)}</Typography>,
                (ev: any) => {
                    console.log('Yo');
                    ev.preventDefault();
                    ev.stopPropagation();
                    el.onSelected(state.search!).then((newUid: string) => {
                        state.onSelected?.(state.search!, newUid);
                    });
                },
            ]),
            ...searchResults.map((el: any) => [
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
                    <Typography style={{ color: 'grey', marginLeft: '2px' }}>
                        {window.unigraph.getNamespaceMap?.()?.[el.type]?._name}
                    </Typography>
                    <Divider variant="middle" orientation="vertical" style={{ height: '16px', alignSelf: 'center' }} />
                    <Typography variant="body1">{el.name}</Typography>
                </div>,
                (ev: any) => {
                    console.log('Yo');
                    ev.preventDefault();
                    ev.stopPropagation();
                    state.onSelected?.(el.name, el.uid);
                },
            ]),
        ]);
    }, [searchResults, state]);

    React.useEffect(() => {
        const handler = (ev: any) => {
            if (ctxMenuState.value.show && ev.key === 'ArrowDown') {
                console.log('D');
                ev.preventDefault();
                ev.stopPropagation();
                setCurrentAction((ca) => ca + 1);
            } else if (ctxMenuState.value.show && ev.key === 'ArrowUp') {
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
                        padding: '10px',
                        borderRadius: '16px',
                    },
                }}
            >
                {actionItems.map((el: any, index: number) => (
                    <div
                        onPointerDown={el[1]}
                        style={{
                            ...(index === currentAction
                                ? {
                                      borderRadius: '6px',
                                      backgroundColor: 'gainsboro',
                                  }
                                : {}),
                            cursor: 'pointer',
                        }}
                        id={`globalSearchItem_${index === currentAction ? 'current' : ''}`}
                    >
                        {el[0]}
                    </div>
                ))}
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
    setInSearch?: any,
    hideHidden = true,
) => {
    let hasMatch = false;
    const placeholder = /\[\[([^[\]]*)\]\]/g;
    for (let match: any; (match = placeholder.exec(newText)) !== null; ) {
        if (match.index <= caret && placeholder.lastIndex >= caret) {
            if (setInSearch) setInSearch(true);
            hasMatch = true;
            // inputDebounced.cancel();
            setSearchPopup(domEl, match[1], onMatch.bind(this, match), hideHidden);
        }
    }
    return hasMatch;
};

export const inlineObjectSearch = (
    newText: string,
    domEl: any,
    caret: number,
    onMatch: any,
    setInSearch?: any,
    hideHidden = true,
) => {
    let hasMatch = false;
    const placeholder = /\(\(([^[\)]*)\)\)/g;
    for (let match: any; (match = placeholder.exec(newText)) !== null; ) {
        if (match.index <= caret && placeholder.lastIndex >= caret) {
            if (setInSearch) setInSearch(true);
            hasMatch = true;
            // inputDebounced.cancel();
            setSearchPopup(domEl, match[1], onMatch.bind(this, match), hideHidden);
        }
    }
    return hasMatch;
};

export const inlineRefsToChildren = (refs?: any[]) =>
    (refs || []).map(({ key, value }) => ({
        type: {
            'unigraph.id': '$/schema/interface/semantic',
        },
        $parentcontext: {
            _key: `[[${key}]]`,
        },
        _value: { uid: value },
    }));
