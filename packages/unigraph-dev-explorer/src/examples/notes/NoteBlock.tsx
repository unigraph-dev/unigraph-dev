/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-param-reassign */
import { makeStyles, TextareaAutosize, Typography } from '@material-ui/core';
import React, { FormEvent } from 'react';
import { byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';
import _ from 'lodash';
import { blobToBase64, buildGraph, findUid, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { Actions } from 'flexlayout-react';
import { FiberManualRecord, MoreVert } from '@material-ui/icons';
import stringify from 'json-stable-stringify';
import { mdiClockOutline, mdiNoteOutline } from '@mdi/js';
import { Icon } from '@mdi/react';
import Sugar from 'sugar';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { ViewViewDetailed } from '../../components/ObjectView/DefaultObjectView';

import {
    addChild,
    convertChildToTodo,
    focusLastDFSNode,
    focusNextDFSNode,
    indentChild,
    splitChild,
    unindentChild,
    unsplitChild,
    replaceChildWithUid,
    addChildren,
    permanentlyDeleteBlock,
    deleteChild,
    copyChildToClipboard,
    replaceChildWithEmbedUid,
} from './commands';
import { onUnigraphContextMenu } from '../../components/ObjectView/DefaultObjectContextMenu';
import { noteQuery, noteQueryDetailed } from './noteQuery';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { getCaret, removeAllPropsFromObj, scrollIntoViewIfNeeded, selectUid, setCaret, TabContext } from '../../utils';
import { DragandDrop } from '../../components/ObjectView/DragandDrop';
import { inlineObjectSearch, inlineTextSearch } from '../../components/UnigraphCore/InlineSearchPopup';
import { htmlToMarkdown } from '../semantic/Markdown';
import { parseUnigraphHtml, setClipboardHandler } from '../../clipboardUtils';

const closeScopeCharDict: { [key: string]: string } = {
    '[': ']',
    '(': ')',
    '"': '"',
    '`': '`',
    $: '$',
    // '{':'}',
};

const caretFromLastLine = (text: string, _caret: number) => {
    // get position of caret in last line
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    const lastLineLength = lastLine.length;
    const caretInLine = _caret - (text.length - lastLineLength);
    return caretInLine;
};
const caretToLastLine = (text: string, _caret: number) => {
    // get position of caret in last line
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    const lastLineLength = lastLine.length;
    const caretInLine = _caret + (text.length - lastLineLength);
    return caretInLine;
};

const childrenComponents = {
    '$/schema/note_block': {
        view: DetailedNoteBlock,
        query: noteQuery,
    },
    '$/schema/view': {
        view: ViewViewDetailed,
    },
    '$/schema/embed_block': {
        view: DetailedEmbedBlock,
        query: noteQuery,
    },
};

const BlockChild = ({ elindex, shortcuts, displayAs, isCollapsed, setCollapsed, callbacks, el }: any) => (
    <AutoDynamicView
        noDrag
        noContextMenu
        compact
        allowSubentity
        customBoundingBox
        noClickthrough
        noSubentities={['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id'])}
        noBacklinks={['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id'])}
        object={
            ['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id'])
                ? el
                : {
                      uid: el.uid,
                      type: el.type,
                  }
        }
        index={elindex}
        expandedChildren
        shortcuts={shortcuts}
        callbacks={callbacks}
        components={childrenComponents}
        attributes={{
            isChildren: true,
            isCollapsed,
            displayAs,
            setCollapsed,
        }}
        recursive
    />
);

const getShortcuts = (data: any, editorContext: any, elindex: any, copyOrCutHandler: any, callbacks: any) => ({
    'shift+Tab': (ev: any) => {
        ev.preventDefault();
        callbacks['unindent-child']?.(elindex);
    },
    Tab: (ev: any) => {
        ev.preventDefault();
        indentChild(data, editorContext, elindex);
    },
    Backspace: (ev: any) => {
        if (window.unigraph.getState('global/selected').value.length > 0) {
            ev.preventDefault();
            deleteChild(data, editorContext, elindex);
        }
    },
    'ctrl+Backspace': (ev: any) => {
        if (window.unigraph.getState('global/selected').value.length > 0) {
            ev.preventDefault();
            deleteChild(data, editorContext, elindex, true);
        }
    },
    oncopy: (ev: any) => copyOrCutHandler(ev, elindex, false),
    oncut: (ev: any) => copyOrCutHandler(ev, elindex, true),
});

const getCallbacks = (callbacks: any, data: any, editorContext: any, elindex: any) => ({
    ...callbacks,
    ...Object.fromEntries(
        Object.entries(noteBlockCommands).map(([k, v]: any) => [
            k,
            (...args: any[]) => v(data, editorContext, elindex, ...args),
        ]),
    ),
    'unindent-child-in-parent': () => {
        callbacks['unindent-child']?.(elindex);
    },
    'focus-last-dfs-node': focusLastDFSNode,
    'focus-next-dfs-node': focusNextDFSNode,
    'add-children': (its: string[], indexx?: number, changeValue?: string | false) =>
        indexx
            ? addChildren(data, editorContext, elindex + indexx, its, changeValue)
            : addChildren(data, editorContext, elindex, its, changeValue),
    'add-parent-backlinks': (childrenUids: string[]) => {
        const parents = getParentsAndReferences(
            data['~_value'],
            (data['unigraph.origin'] || []).filter((ell: any) => ell.uid !== data.uid),
        )[0]
            .map((ell: any) => ell?.uid)
            .filter(Boolean);
        if (!data._hide) parents.push(data.uid);
        window.unigraph.addBacklinks(parents, childrenUids);
    },
    context: data,
    isEmbed: true,
    isChildren: true,
    parentEditorContext: editorContext,
});

const BlockChildren = ({
    isCollapsed,
    isChildren,
    subentities,
    tabContext,
    data,
    isChildrenCollapsed,
    setIsChildrenCollapsed,
    editorContext,
    displayAs,
    childrenDisplayAs,
    callbacks,
    copyOrCutHandler,
}: any) =>
    !(isCollapsed === true) ? (
        <div style={{ width: '100%' }}>
            {subentities.length || isChildren ? (
                <DragandDrop
                    dndContext={tabContext.viewId}
                    listId={data?.uid}
                    arrayId={data?._value?.children?.uid}
                    style={{
                        position: 'absolute',
                        height: '6px',
                        marginTop: '-3px',
                        marginBottom: '1px',
                        zIndex: 999,
                    }}
                >
                    {subentities.map((el: any, elindex: any) => {
                        const isCol = isChildrenCollapsed[el.uid];
                        return (
                            <OutlineComponent
                                key={el.uid}
                                isChildren={isChildren}
                                collapsed={isCol}
                                setCollapsed={(val: boolean) => {
                                    setIsChildrenCollapsed({
                                        ...isChildrenCollapsed,
                                        [el.uid]: val,
                                    });
                                }}
                                createBelow={() => {
                                    addChild(data, editorContext, elindex);
                                }}
                                displayAs={childrenDisplayAs}
                                parentDisplayAs={displayAs}
                            >
                                <BlockChild
                                    el={el}
                                    elindex={elindex}
                                    editorContext={editorContext}
                                    callbacks={getCallbacks(callbacks, data, editorContext, elindex)}
                                    shortcuts={getShortcuts(data, editorContext, elindex, copyOrCutHandler, callbacks)}
                                    isCollapsed={isCol}
                                    setCollapsed={(val: boolean) => {
                                        setIsChildrenCollapsed({
                                            ...isChildrenCollapsed,
                                            [el.uid]: val,
                                        });
                                    }}
                                    displayAs={childrenDisplayAs}
                                />
                            </OutlineComponent>
                        );
                    })}
                </DragandDrop>
            ) : (
                <OutlineComponent
                    isChildren={isChildren}
                    displayAs={data?._value?.children?._displayAs || 'outliner'}
                    parentDisplayAs={displayAs}
                >
                    <PlaceholderNoteBlock
                        callbacks={{
                            'add-child': () => noteBlockCommands['add-child'](data, editorContext),
                        }}
                    />
                </OutlineComponent>
            )}
        </div>
    ) : (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <></>
    );

export function NoteBlock({ data, inline }: any) {
    const [parents, references] = getParentsAndReferences(
        data['~_value'],
        (data['unigraph.origin'] || []).filter((el: any) => el.uid !== data.uid),
    );
    const [subentities, otherChildren] = getSubentities(data);

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flexGrow: 1 }}>
                <Typography variant="body1">
                    {data?._hide ? (
                        []
                    ) : (
                        <Icon
                            path={mdiNoteOutline}
                            size={0.8}
                            style={{ opacity: 0.54, marginRight: '4px', verticalAlign: 'text-bottom' }}
                        />
                    )}
                    <AutoDynamicView
                        object={data.get('text')?._value._value}
                        noDrag
                        noDrop
                        inline
                        noContextMenu
                        callbacks={{
                            'get-semantic-properties': () => data,
                        }}
                    />
                </Typography>
                {inline ? (
                    []
                ) : (
                    <Typography variant="body2" color="textSecondary">
                        {subentities.length} immediate children, {parents.length} parents, {references.length} linked
                        references
                    </Typography>
                )}
            </div>
            <div>
                {otherChildren.map((el: any) => (
                    <AutoDynamicView object={el} inline />
                ))}
            </div>
        </div>
    );
}

const persistCollapsedNodes = (nodes: any) => {
    const localState = JSON.parse(window.localStorage.getItem('noteblockCollapsedByUid') || '{}');
    window.localStorage.setItem('noteblockCollapsedByUid', JSON.stringify({ ...localState, ...nodes }));
};

const noteBlockCommands = {
    'add-child': addChild,
    'add-children': addChildren,
    'unsplit-child': unsplitChild,
    'split-child': splitChild,
    'indent-child': indentChild,
    'delete-child': deleteChild,
    'unindent-child': unindentChild,
    'convert-child-to-todo': convertChildToTodo,
    'replace-child-with-uid': replaceChildWithUid,
    'replace-child-with-embed-uid': replaceChildWithEmbedUid,
};

export function PlaceholderNoteBlock({ callbacks }: any) {
    return (
        <div style={{ width: '100%' }}>
            <Typography
                variant="body1"
                style={{ fontStyle: 'italic' }}
                onClick={() => {
                    callbacks['add-child']();
                }}
            >
                Click here to start writing
            </Typography>
        </div>
    );
}

export function OutlineComponent({
    children,
    collapsed,
    setCollapsed,
    isChildren,
    createBelow,
    displayAs,
    parentDisplayAs,
}: any) {
    return (
        <div
            style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'baseline',
                position: 'relative',
            }}
        >
            <div
                style={{ position: 'absolute', left: '-4px' }}
                className="showOnHover"
                onClick={() => setCollapsed(!collapsed)}
            >
                O
            </div>
            <div
                style={{ position: 'absolute', left: '-4px', top: '8px' }}
                className="showOnHover"
                onClick={() => createBelow()}
            >
                V
            </div>
            {displayAs === 'outliner' ? (
                <>
                    <div
                        style={{
                            height: 'calc(100% + 4px)',
                            width: '1px',
                            backgroundColor: 'gray',
                            position: 'absolute',
                            left: '-12px',
                            display: parentDisplayAs === 'outliner' ? '' : 'none',
                        }}
                    />
                    <FiberManualRecord
                        style={{
                            fontSize: '0.5rem',
                            marginLeft: '8px',
                            marginRight: '8px',
                            ...(collapsed
                                ? {
                                      borderRadius: '4px',
                                      color: 'lightgray',
                                      backgroundColor: 'black',
                                  }
                                : {}),
                        }}
                    />
                </>
            ) : (
                []
            )}
            <div style={{ flexGrow: 1, marginLeft: displayAs === 'outliner' || !parentDisplayAs ? '' : '24px' }}>
                {children}
            </div>
        </div>
    );
}

export function ParentsAndReferences({ data }: any) {
    const [parents, setParents] = React.useState([]);
    const [references, setReferences] = React.useState([]);

    React.useEffect(() => {
        const [newPar, newRef]: any = getParentsAndReferences(
            data['~_value'],
            (data['unigraph.origin'] || []).filter((el: any) => el.uid !== data.uid),
        );
        if (stringify(parents) !== stringify(newPar)) setParents(newPar);
        if (stringify(references) !== stringify(newRef)) setReferences(newRef);
    }, [data]);

    return (
        <div style={{ marginTop: '36px' }}>
            <DynamicObjectListView
                items={parents}
                context={data}
                compact
                noDrop
                titleBar=" parents"
                loadAll
                components={{
                    '$/schema/note_block': {
                        view: NoChildrenReferenceNoteView,
                        query: noteQueryDetailed,
                        noClickthrough: true,
                        noSubentities: true,
                        noContextMenu: true,
                        noBacklinks: true,
                    },
                }}
            />
            <DynamicObjectListView
                items={references}
                context={data}
                compact
                noDrop
                titleBar=" linked references"
                loadAll
                components={{
                    '$/schema/note_block': {
                        view: ReferenceNoteView,
                        query: noteQueryDetailed,
                        noClickthrough: true,
                        noSubentities: true,
                        noContextMenu: true,
                        noBacklinks: true,
                    },
                }}
            />
        </div>
    );
}

function NoteViewPageWrapper({ children, isRoot }: any) {
    return !isRoot ? children : <div style={{ height: '100%', width: '100%', padding: '16px' }}>{children}</div>;
}

function NoteViewTextWrapper({ children, semanticChildren, isRoot, onContextMenu, callbacks, isEditing }: any) {
    // console.log(callbacks.BacklinkComponent);
    return (
        <div
            style={{ display: 'flex', alignItems: 'center' }}
            onContextMenu={isRoot || isEditing ? undefined : onContextMenu}
        >
            {children}
            {semanticChildren}
            {isRoot ? <MoreVert onClick={onContextMenu} style={{ marginLeft: '8px' }} /> : []}
            {callbacks.BacklinkComponent ? callbacks.BacklinkComponent : []}
        </div>
    );
}

const useStyles = makeStyles((theme) => ({
    noteTextarea: {
        ...theme.typography.body1,
        border: 'none',
        outline: 'none',
        width: '100%',
    },
}));
const setFocusedCaret = (textInputEl: any) => {
    let caret;
    if (textInputEl.selectionStart !== undefined) {
        caret = textInputEl.selectionStart;
    } else {
        const sel = document.getSelection();
        caret = _.min([sel?.anchorOffset, sel?.focusOffset]) as number;
    }
    const state = window.unigraph.getState('global/focused');
    state.setValue({ ...state.value, caret });
};

export function DetailedNoteBlock({
    data,
    isChildren,
    callbacks,
    options,
    isCollapsed,
    setCollapsed,
    focused,
    index,
    componentId,
    displayAs,
}: any) {
    // eslint-disable-next-line no-bitwise
    isChildren |= callbacks?.isChildren;
    if (!callbacks?.viewId) callbacks = { ...(callbacks || {}), viewId: getRandomInt() };
    const [subentities, otherChildren] = getSubentities(data);
    const [command, setCommand] = React.useState<() => any | undefined>();
    const inputter = (text: string) => {
        if (data?._value?.children?.['_value[']) {
            const deadLinks: any = [];
            data._value.children['_value['].forEach((el: any) => {
                if (el && el._key && !text.includes(el._key)) deadLinks.push(el.uid);
            });
            if (deadLinks.length) window.unigraph.deleteItemFromArray(data._value.children.uid, deadLinks, data.uid);
        }

        return window.unigraph.updateObject(
            data.get('text')._value._value.uid,
            {
                '_value.%': text,
            },
            false,
            false,
            callbacks.subsId,
            [],
        );
    };
    const textInput: any = React.useRef();
    /** Reference for HTML Element for list of children */
    const editorRef = React.useRef<any>();
    const inputDebounced = React.useRef(_.debounce(inputter, 333));
    const setCurrentText = (text: string) => {
        const nativeInputValueSetter = Object?.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value',
        )?.set;
        nativeInputValueSetter?.call(textInput.current, text);

        const event = new Event('change', { bubbles: true });
        textInput.current.dispatchEvent(event);
    };
    const getCurrentText = () => textInput.current.value;
    const edited = React.useRef(false);
    const [isEditing, setIsEditing] = React.useState(
        window.unigraph.getState('global/focused').value?.uid === data.uid,
    );
    const nodesState = window.unigraph.addState(`${options?.viewId || callbacks?.viewId}/nodes`, []);
    const [caretPostRender, setCaretPostRender] = React.useState<number | undefined>(undefined);
    const fulfillCaretPostRender = React.useCallback(() => {
        if (caretPostRender !== undefined) {
            setCaret(document, textInput.current, caretPostRender);
            setCaretPostRender(undefined);
        }
    }, [caretPostRender]);
    const editorContext = {
        edited,
        setCommand,
        callbacks,
        nodesState,
    };
    const tabContext = React.useContext(TabContext);

    const handlePotentialResize = () => {
        const listener = () => {
            scrollIntoViewIfNeeded(textInput.current);
        };
        window.addEventListener('resize', listener);
        setTimeout(() => {
            window.removeEventListener('resize', listener);
        }, 1000);
    };

    const commandFn = () => {
        if (edited.current !== true && command) {
            command();
            setCommand(undefined);
        }
    };
    const resetEdited = () => {
        edited.current = false;
        setTimeout(() => {
            commandFn();
        });
    };

    const [isChildrenCollapsed, _setIsChildrenCollapsed] = React.useState<any>(
        Object.fromEntries(
            Object.entries(JSON.parse(window.localStorage.getItem('noteblockCollapsedByUid') || '{}')).filter(
                ([key, value]: any) => subentities.map((el: any) => el.uid).includes(key),
            ),
        ),
    );
    const setIsChildrenCollapsed = (newCollapsed: any) => {
        persistCollapsedNodes(newCollapsed);
        _setIsChildrenCollapsed(newCollapsed);
    };

    React.useEffect(() => {
        if (callbacks?.registerBoundingBox) {
            callbacks.registerBoundingBox(editorRef.current);
        }
    }, []);

    React.useEffect(() => {
        const newNodes = _.unionBy(
            [
                {
                    uid: data.uid,
                    componentId,
                    children: isCollapsed ? [] : subentities.map((el: any) => el.uid),
                    type: data?.type?.['unigraph.id'],
                    root: !isChildren,
                },
                ...subentities
                    .filter(
                        (el: any) =>
                            !['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id']),
                    )
                    .map((el: any) => {
                        const [subs] = getSubentities(el);
                        return {
                            uid: el.uid,
                            children: subs.map((ell: any) => ell.uid),
                            type: el?.type?.['unigraph.id'],
                            root: false,
                        };
                    }),
            ],
            nodesState.value,
            'uid',
        );
        nodesState.setValue(newNodes);
        // if (!isChildren) console.log(getParentsAndReferences(data['~_value'], (data['unigraph.origin'] || []).filter((el: any) => el.uid !== data.uid)))
    }, [JSON.stringify(subentities.map((el: any) => el.uid).sort()), data.uid, componentId, isCollapsed]);

    const checkReferences = React.useCallback(
        (matchOnly?: boolean) => {
            // const newContent = textInput.current.textContent;
            const newContent = getCurrentText();
            const caret = textInput.current.selectionStart;
            // Check if inside a reference block

            let hasMatch = false;
            hasMatch =
                inlineTextSearch(
                    getCurrentText(),
                    textInput,
                    caret,
                    async (match: any, newName: string, newUid: string) => {
                        const parents = getParentsAndReferences(data['~_value'], data['unigraph.origin'] || [])[0].map(
                            (el: any) => ({ uid: el.uid }),
                        );
                        if (!data._hide) parents.push({ uid: data.uid });
                        const newStr = `${newContent?.slice?.(0, match.index)}[[${newName}]]${newContent?.slice?.(
                            match.index + match[0].length,
                        )}`;
                        // console.log(newName, newUid, newStr, newContent);
                        // This is an ADDITION operation
                        // console.log(data);
                        const semChildren = data?._value;
                        // inputDebounced.cancel();
                        // textInput.current.textContent = newStr;
                        setCurrentText(newStr);
                        resetEdited();
                        setCaret(document, textInput.current, match.index + newName.length + 4);
                        await window.unigraph.updateObject(
                            data.uid,
                            {
                                _value: {
                                    text: { _value: { _value: { '_value.%': newStr } } },
                                    children: {
                                        '_value[': [
                                            {
                                                _index: {
                                                    '_value.#i': semChildren?.children?.['_value[']?.length || 0,
                                                },
                                                _key: `[[${newName}]]`,
                                                _value: {
                                                    'dgraph.type': ['Interface'],
                                                    type: { 'unigraph.id': '$/schema/interface/semantic' },
                                                    _hide: true,
                                                    _value: { uid: newUid },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                            true,
                            false,
                            callbacks.subsId,
                            parents,
                        );
                        window.unigraph.getState('global/searchPopup').setValue({ show: false });
                    },
                    undefined,
                    matchOnly,
                ) || hasMatch;
            hasMatch =
                inlineObjectSearch(
                    // textInput.current.textContent,
                    getCurrentText(),
                    textInput,
                    caret,
                    async (match: any, newName: string, newUid: string, newType: string) => {
                        if (newType !== '$/schema/note_block') {
                            callbacks['replace-child-with-embed-uid'](newUid);
                        } else {
                            callbacks['replace-child-with-uid'](newUid);
                            setTimeout(() => {
                                // callbacks['add-child']();
                                permanentlyDeleteBlock(data);
                            }, 500);
                        }
                        window.unigraph.getState('global/searchPopup').setValue({ show: false });
                        callbacks['focus-next-dfs-node'](data, editorContext, 0);
                    },
                    false,
                    matchOnly,
                ) || hasMatch;
            if (!hasMatch) {
                window.unigraph.getState('global/searchPopup').setValue({ show: false });
            }
        },
        [callbacks, componentId, data, data.uid, data?._value?.children?.uid, editorContext, resetEdited],
    );

    React.useEffect(() => {
        const dataText = data.get('text')?.as('primitive');
        if (dataText && options?.viewId && !callbacks.isEmbed)
            window.layoutModel.doAction(Actions.renameTab(options.viewId, `Note: ${dataText}`));
        if (getCurrentText() !== dataText && !edited.current) {
            setCurrentText(dataText);
        } else if ((getCurrentText() === dataText && edited.current) || getCurrentText() === '') {
            resetEdited();
        }

        if (!edited.current) fulfillCaretPostRender();
    }, [data.get('text')?.as('primitive'), isEditing, fulfillCaretPostRender]);

    React.useEffect(() => {
        // set caret when focus changes
        if (focused) {
            const setCaretFn = () => {
                textInput?.current?.focus();
                let caret;
                const focusedState2 = window.unigraph.getState('global/focused').value;
                // const el = textInput.current?.firstChild || textInput.current;
                if (focusedState2.tail) {
                    // if coming from below
                    if (focusedState2.caret === -1) {
                        // caret -1 means we're landing at the end of the current block (by pressing arrow left)
                        caret = getCurrentText().length;
                    } else {
                        caret = caretToLastLine(getCurrentText(), focusedState2.caret);
                    }
                }

                if (focusedState2.newData) {
                    setCurrentText(focusedState2.newData);
                    delete focusedState2.newData;
                }
                // last caret might be coming from a longer line, or as -1
                caret = caret || _.min([_.max([focusedState2.caret, 0]), getCurrentText().length]);

                setCaret(document, textInput.current, caret);
            };
            if (!isEditing) {
                setIsEditing(true);
                setTimeout(setCaretFn, 0);
            } else {
                // textInput.current.focus();
                setCaretFn();
                handlePotentialResize();
            }
        }
    }, [focused]);

    React.useEffect(() => {
        const fn = (state: any) => {
            if (state.component !== componentId) return;
            checkReferences(true);
        };
        window.unigraph.getState('global/focused').subscribe(fn);
        return () => window.unigraph.getState('global/focused').unsubscribe(fn);
    }, [componentId, checkReferences]);

    React.useEffect(() => {
        if (focused) {
            scrollIntoViewIfNeeded(textInput.current);
        }
    }, [data.uid, index, focused]);

    React.useEffect(() => {
        if (focused) {
            window.unigraph.getState('global/focused/actions').setValue({
                splitChild: () => {
                    // const sel = document.getSelection();
                    // const caret = _.min([sel?.anchorOffset, sel?.focusOffset]) as number;
                    callbacks['split-child'](
                        getCurrentText() || data.get('text')?.as('primitive'),
                        textInput.current.selectionStart,
                    );
                },
                indentChild: callbacks['indent-child'],
                unindentChild: callbacks['unindent-child-in-parent'],
            });
        }
    }, [data.get('text')?.as('primitive'), focused]);

    const onBlurHandler = React.useCallback(() => {
        setIsEditing(false);
        inputDebounced.current.flush();
        if (focused && window.unigraph.getState('global/focused').value.component === componentId) {
            window.unigraph.getState('global/focused').setValue({ uid: '', caret: 0, type: '' });
        }
    }, [focused]);

    const copyOrCutHandler = React.useCallback(
        (ev, elindex, isCut) => {
            if (window.unigraph.getState('global/selected').value.length > 0) {
                ev.preventDefault();
                const clipboardData = copyChildToClipboard(data, editorContext, elindex, isCut);
                window.unigraph
                    .getState('temp/clipboardItems')
                    .setValue((val: any) => (Array.isArray(val) ? [...val, clipboardData] : [clipboardData]));
                return setClipboardHandler;
            }
            return false;
        },
        [data, editorContext, componentId],
    );

    const onPasteHandler = React.useCallback(
        (event) => {
            const paste = (event.clipboardData || (window as any).clipboardData).getData('text/html');

            const img = event.clipboardData.items[0];

            if (paste.length > 0) {
                const selection = window.getSelection();
                if (!selection?.rangeCount) return false;
                selection?.deleteFromDocument();

                const unigraphHtml = parseUnigraphHtml(paste);
                if (unigraphHtml) {
                    const entities = Array.from(unigraphHtml.body.children[0].children).map((el) => el.id);
                    const childrenEntities = Array.from(unigraphHtml.body.children[0].children)
                        .map((el) => el.getAttribute('children-uids')?.split(','))
                        .flat();
                    callbacks['add-children'](entities, getCurrentText().length ? 0 : -1);
                    // console.log(childrenEntities);
                    callbacks['add-parent-backlinks'](childrenEntities);
                } else {
                    const mdresult = htmlToMarkdown(paste);
                    const lines = mdresult.split('\n\n');

                    document.execCommand('insertText', false, lines[0]);

                    edited.current = true;

                    if (lines.length > 1) {
                        const newLines = lines.slice(1);
                        callbacks['add-children'](newLines, undefined, getCurrentText());
                    } else {
                        inputDebounced.current(getCurrentText());
                        inputDebounced.current.flush();
                    }
                }

                event.preventDefault();
            } else if (img.type.indexOf('image') === 0) {
                const blob = img.getAsFile();
                if (blob) {
                    event.preventDefault();

                    blobToBase64(blob).then((base64: string) => {
                        const selection = window.getSelection();
                        if (!selection?.rangeCount) return false;
                        selection?.deleteFromDocument();

                        const res = `![${blob.name || 'image'}](${base64})`;

                        selection.getRangeAt(0).insertNode(document.createTextNode(res));
                        selection.collapseToEnd();

                        edited.current = true;
                        inputDebounced.current(getCurrentText());
                        inputDebounced.current.flush();
                        return false;
                    });
                }
            }
            setFocusedCaret(textInput.current);
            return event;
        },
        [callbacks],
    );

    const onInputHandler = React.useCallback(
        (ev) => {
            // if (ev.currentTarget.textContent !== data.get('text').as('primitive') && !edited.current) edited.current = true;
            // console.log('handling Input', ev);
            if (ev.target.value !== data.get('text').as('primitive')) {
                if (!edited.current) edited.current = true;
                checkReferences();
                inputDebounced.current(ev.target.value);
            }
        },
        [checkReferences, data],
    );

    const handleOpenScopedChar = React.useCallback((ev: KeyboardEvent) => {
        ev.preventDefault();
        // console.log(document.getSelection())
        const caret = textInput.current.selectionStart;
        let middle = document.getSelection()?.toString() || '';
        let end = '';
        if (middle.endsWith(' ')) {
            middle = middle.slice(0, middle.length - 1);
            end = ' ';
        }
        // document.execCommand('insertText', false, `[${middle}]${end}`);
        setCurrentText(
            `${getCurrentText().slice(0, caret)}${ev.key}${middle}${
                closeScopeCharDict[ev.key]
            }${end}${getCurrentText().slice(caret + (middle + end).length)}`,
        );
        // setCaret(document, textInput.current, caret + 1, middle.length);
        setCaret(document, textInput.current, caret + 1, middle.length);
        textInput.current.dispatchEvent(
            new Event('change', {
                bubbles: true,
                cancelable: true,
            }),
        );
    }, []);

    const onKeyDownHandler = React.useCallback(
        (ev) => {
            const caret = textInput.current.selectionStart;
            switch (ev.key) {
                case 'a': // "a" key
                    if (
                        ev.ctrlKey ||
                        (ev.metaKey && caret === 0 && textInput.current.selectionEnd === getCurrentText().length)
                    ) {
                        ev.preventDefault();
                        selectUid(componentId);
                        onBlurHandler();
                    }
                    break;

                case 'Enter': // enter
                    if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
                        ev.preventDefault();
                        edited.current = false;
                        inputDebounced.current.cancel();
                        const currentText = getCurrentText() || data.get('text').as('primitive');
                        callbacks['split-child']?.(currentText, caret);
                        // setCurrentText(currentText.slice(caret));
                        setCaretPostRender(0);
                    } else if (ev.ctrlKey || ev.metaKey) {
                        ev.preventDefault();
                        edited.current = false;
                        inputDebounced.current.cancel();
                        callbacks['convert-child-to-todo']?.(getCurrentText());
                    }
                    break;

                case 'Tab': // tab
                    ev.preventDefault();
                    ev.stopPropagation();
                    inputDebounced.current.flush();
                    if (ev.shiftKey) {
                        setCommand(() => callbacks['unindent-child-in-parent']?.bind(null));
                    } else {
                        setCommand(() => callbacks['indent-child']?.bind(null));
                    }
                    break;

                case 'Backspace': // backspace
                    // console.log(caret, document.getSelection()?.type)
                    if (caret === 0 && document.getSelection()?.type === 'Caret') {
                        ev.preventDefault();
                        ev.stopPropagation();
                        inputDebounced.current.cancel();
                        edited.current = false;
                        callbacks['unsplit-child'](getCurrentText());
                    } else if (getCurrentText()[caret - 1] === '[' && getCurrentText()[caret] === ']') {
                        ev.preventDefault();
                        ev.stopPropagation();
                        const tc = getCurrentText();
                        // const el = textInput.current;
                        // el.textContent = tc.slice(0, caret - 1) + tc.slice(caret + 1);
                        setCurrentText(tc.slice(0, caret - 1) + tc.slice(caret + 1));
                        setCaret(document, textInput.current, caret - 1);
                    }
                    break;

                case 'ArrowLeft': // left arrow
                    if (caret === 0) {
                        ev.preventDefault();
                        inputDebounced.current.flush();
                        callbacks['focus-last-dfs-node'](data, editorContext, true, -1);
                    }
                    break;

                case 'ArrowRight': // right arrow
                    if (caret === getCurrentText().length) {
                        ev.preventDefault();
                        inputDebounced.current.flush();
                        callbacks['focus-next-dfs-node'](data, editorContext, false, 0);
                    }
                    break;

                case 'ArrowUp': // up arrow
                    textInput.current.style['caret-color'] = 'transparent';
                    inputDebounced.current.flush();
                    requestAnimationFrame(() => {
                        const newCaret = textInput.current.selectionStart;
                        if (newCaret === 0) {
                            if (ev.shiftKey) {
                                selectUid(componentId, false);
                            }
                            callbacks['focus-last-dfs-node'](data, editorContext, true, caret);
                        }
                        setTimeout(() => {
                            textInput.current.style['caret-color'] = '';
                        }, 0);
                    });
                    return;

                case 'ArrowDown': // down arrow
                    textInput.current.style['caret-color'] = 'transparent';
                    inputDebounced.current.flush();
                    requestAnimationFrame(() => {
                        const newCaret = textInput.current.selectionStart;
                        if ((newCaret || 0) >= (getCurrentText().trim()?.length || 0)) {
                            if (ev.shiftKey) {
                                selectUid(componentId, false);
                            }

                            // when going from a line above, to a line below, the caret is at the end of the line
                            const caretInLine = caretFromLastLine(getCurrentText(), caret);
                            callbacks['focus-next-dfs-node'](data, editorContext, false, caretInLine);
                        }
                        setTimeout(() => {
                            textInput.current.style['caret-color'] = '';
                        }, 0);
                    });
                    return;
                case '(':
                case '[':
                case '"':
                case '`':
                case '$':
                    // handleOpenScopedChar(ev);
                    // break;
                    handleOpenScopedChar(ev);
                    break;

                case ']': // right bracket
                    if (!ev.shiftKey && getCurrentText()[caret] === ']') {
                        ev.preventDefault();
                        // setCaret(document, textInput.current, caret + 1);
                        setCaret(document, textInput.current, caret + 1);
                    }
                    break;

                case ')': // 0 or parenthesis
                    if (ev.shiftKey && getCurrentText()[caret] === ')') {
                        ev.preventDefault();
                        setCaret(document, textInput.current, caret + 1);
                    }
                    break;

                default:
                    // console.log(ev);
                    break;
            }
        },
        [callbacks, componentId, data, editorContext, onBlurHandler, handleOpenScopedChar],
    );

    const onPointerUpHandler = React.useCallback(
        (ev) => {
            if (!isEditing) {
                setIsEditing(true);
            }
            const caretPos = Number((ev.target as HTMLElement).getAttribute('markdownPos') || -1);
            (ev.target as HTMLElement).removeAttribute('markdownPos');
            const finalCaretPos = caretPos === -1 ? getCurrentText().length : caretPos;
            window.unigraph.getState('global/focused').setValue({
                uid: data?.uid,
                caret: finalCaretPos,
                type: '$/schema/note_block',
                component: componentId,
            });
        },
        [componentId, data?.uid, isEditing],
    );

    React.useEffect(commandFn, [command]);

    const childrenDisplayAs = data?._value?.children?._displayAs || 'outliner';
    const classes = useStyles();
    return (
        <NoteViewPageWrapper isRoot={!isChildren}>
            <div
                style={{
                    width: '100%',
                    ...(!isChildren ? { overflow: 'hidden' } : {}),
                }}
            >
                <NoteViewTextWrapper
                    isRoot={!isChildren}
                    isEditing={isEditing}
                    onContextMenu={(event: any) =>
                        onUnigraphContextMenu(event, data, undefined, { ...callbacks, componentId })
                    }
                    callbacks={callbacks}
                    semanticChildren={buildGraph(otherChildren)
                        .filter((el: any) => el.type)
                        .map((el: any) => (
                            <AutoDynamicView
                                object={
                                    ['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id'])
                                        ? el
                                        : { uid: el.uid, type: el.type }
                                }
                                inline
                            />
                        ))}
                >
                    <div
                        key="editor-frame"
                        ref={editorRef}
                        onPointerUp={onPointerUpHandler}
                        onBlur={onBlurHandler}
                        style={{ width: '100%', display: 'flex', cursor: 'text' }}
                    >
                        {isChildren && data._hide !== true ? (
                            <div
                                style={{ display: 'contents' }}
                                onClick={() => {
                                    window.wsnavigator(
                                        `/library/object?uid=${data.uid}&type=${data?.type?.['unigraph.id']}`,
                                    );
                                }}
                            >
                                <Icon path={mdiNoteOutline} size={0.8} style={{ opacity: 0.54, marginRight: '4px' }} />
                            </div>
                        ) : (
                            []
                        )}
                        <TextareaAutosize
                            className={classes.noteTextarea}
                            style={{
                                outline: '0px solid transparent',
                                minWidth: '16px',
                                padding: '0px',
                                display: isEditing ? '' : 'none',
                                resize: 'none',
                            }}
                            ref={textInput}
                            // value={currentText}
                            // onChange={(event) => setCurrentText(event.target.value)}
                            onChange={onInputHandler}
                            onKeyDown={onKeyDownHandler}
                            onPaste={onPasteHandler}
                            onKeyUp={() => setFocusedCaret(textInput.current)}
                            onClick={() => setFocusedCaret(textInput.current)}
                        />
                        <AutoDynamicView
                            object={data.get('text')?._value?._value}
                            attributes={{
                                isHeading: !(isChildren || callbacks.isEmbed),
                            }}
                            style={{ display: isEditing ? 'none' : '' }}
                            noDrag
                            noContextMenu
                            inline
                            noClickthrough
                            callbacks={{
                                'get-semantic-properties': () => data,
                            }}
                        />
                        <Typography
                            style={{
                                display: isEditing || !isCollapsed ? 'none' : '',
                                marginLeft: '6px',
                                color: 'gray',
                                cursor: 'pointer',
                            }}
                            onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                setCollapsed(false);
                            }}
                        >{`(${subentities.length})`}</Typography>
                    </div>
                </NoteViewTextWrapper>
                {!isChildren && !callbacks.isEmbed ? (
                    <div style={{ marginTop: '4px', marginBottom: '12px', display: 'flex', color: 'gray' }}>
                        <Icon path={mdiClockOutline} size={0.8} style={{ marginRight: '4px' }} />
                        {`${new Date(data._updatedAt || 0).toLocaleString()} (${Sugar.Date.relative(
                            new Date(data._updatedAt || 0),
                        )})`}
                    </div>
                ) : (
                    []
                )}
                <BlockChildren
                    isCollapsed={isCollapsed}
                    isChildren={isChildren}
                    subentities={subentities}
                    tabContext={tabContext}
                    data={data}
                    isChildrenCollapsed={isChildrenCollapsed}
                    setIsChildrenCollapsed={setIsChildrenCollapsed}
                    editorContext={editorContext}
                    displayAs={displayAs}
                    childrenDisplayAs={childrenDisplayAs}
                    callbacks={callbacks}
                    copyOrCutHandler={copyOrCutHandler}
                />
                {!isChildren ? <ParentsAndReferences data={data} /> : []}
            </div>
        </NoteViewPageWrapper>
    );
}

export function DetailedEmbedBlock({
    data,
    isChildren,
    callbacks,
    options,
    isCollapsed,
    setCollapsed,
    focused,
    index,
    componentId,
    displayAs,
}: any) {
    // eslint-disable-next-line no-bitwise
    isChildren |= callbacks?.isChildren;
    if (!callbacks?.viewId) callbacks = { ...(callbacks || {}), viewId: getRandomInt() };
    const [subentities, otherChildren] = getSubentities(data);
    const [command, setCommand] = React.useState<() => any | undefined>();
    const editorRef = React.useRef<any>();
    const nodesState = window.unigraph.addState(`${options?.viewId || callbacks?.viewId}/nodes`, []);
    const editorContext = {
        edited: undefined,
        setCommand,
        callbacks,
        nodesState,
    };
    const tabContext = React.useContext(TabContext);

    const [isChildrenCollapsed, _setIsChildrenCollapsed] = React.useState<any>(
        Object.fromEntries(
            Object.entries(JSON.parse(window.localStorage.getItem('noteblockCollapsedByUid') || '{}')).filter(
                ([key, value]: any) => subentities.map((el: any) => el.uid).includes(key),
            ),
        ),
    );
    const setIsChildrenCollapsed = (newCollapsed: any) => {
        persistCollapsedNodes(newCollapsed);
        _setIsChildrenCollapsed(newCollapsed);
    };

    React.useEffect(() => {
        if (callbacks?.registerBoundingBox) {
            callbacks.registerBoundingBox(editorRef.current);
        }
    }, []);

    React.useEffect(() => {
        const newNodes = _.unionBy(
            [
                {
                    uid: data.uid,
                    componentId,
                    children: isCollapsed ? [] : subentities.map((el: any) => el.uid),
                    type: data?.type?.['unigraph.id'],
                    root: !isChildren,
                },
                ...subentities
                    .filter(
                        (el: any) =>
                            !['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id']),
                    )
                    .map((el: any) => {
                        const [subs] = getSubentities(el);
                        return {
                            uid: el.uid,
                            children: subs.map((ell: any) => ell.uid),
                            type: el?.type?.['unigraph.id'],
                            root: false,
                        };
                    }),
            ],
            nodesState.value,
            'uid',
        );
        nodesState.setValue(newNodes);
    }, [JSON.stringify(subentities.map((el: any) => el.uid).sort()), data.uid, componentId, isCollapsed]);

    React.useEffect(() => {
        if (focused) {
            // TODO: focus the main thing
            editorRef.current.focus();
        }
    }, [focused]);

    React.useEffect(() => {
        if (focused) {
            window.unigraph.getState('global/focused/actions').setValue({
                splitChild: () => {
                    callbacks['add-child']();
                },
                indentChild: callbacks['indent-child'],
                unindentChild: callbacks['unindent-child-in-parent'],
            });
        }
    }, [data.get('text')?.as('primitive'), focused]);

    const onBlurHandler = React.useCallback(() => {
        // setIsEditing(false);
        // inputDebounced.current.flush();
        if (focused && window.unigraph.getState('global/focused').value.component === componentId) {
            window.unigraph.getState('global/focused').setValue({ uid: '', caret: 0, type: '' });
        }
    }, [focused]);

    const copyOrCutHandler = React.useCallback(
        (ev, elindex, isCut) => {
            if (window.unigraph.getState('global/selected').value.length > 0) {
                // TODO: copy/cut selected
            }
            return false;
        },
        [data, editorContext, componentId],
    );

    const onKeyDownHandler = React.useCallback(
        (ev) => {
            const sel = document.getSelection();
            const caret = _.min([sel?.anchorOffset, sel?.focusOffset]) as number;
            switch (ev.key) {
                case 'Enter': // enter
                    if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
                        ev.preventDefault();
                        callbacks['add-child']();
                    } else if (ev.ctrlKey || ev.metaKey) {
                        ev.preventDefault();
                    }
                    break;

                case 'Backspace': // backspace
                    // console.log(caret, document.getSelection()?.type)
                    callbacks['delete-child']();
                    break;

                case 'Tab': // tab
                    ev.preventDefault();
                    ev.stopPropagation();
                    // inputDebounced.current.flush();
                    if (ev.shiftKey) {
                        callbacks['unindent-child-in-parent']?.();
                    } else {
                        callbacks['indent-child']?.();
                    }
                    break;

                case 'ArrowLeft': // left arrow
                case 'ArrowUp': // up arrow
                    ev.preventDefault();
                    // inputDebounced.current.flush();
                    callbacks['focus-last-dfs-node'](data, editorContext, true, -1);
                    break;

                case 'ArrowRight': // right arrow
                case 'ArrowDown': // down arrow
                    ev.preventDefault();
                    // inputDebounced.current.flush();
                    callbacks['focus-next-dfs-node'](data, editorContext, false, 0);
                    break;

                default:
                    // console.log(ev);
                    break;
            }
        },
        [callbacks, componentId, data, editorContext, onBlurHandler],
    );

    const childrenDisplayAs = data?._value?.children?._displayAs || 'outliner';

    return (
        <NoteViewPageWrapper isRoot={!isChildren}>
            <div
                style={{
                    width: '100%',
                    ...(!isChildren ? { overflow: 'hidden' } : {}),
                }}
            >
                <NoteViewTextWrapper
                    isRoot={!isChildren}
                    isEditing={false}
                    onContextMenu={(event: any) =>
                        onUnigraphContextMenu(event, data, undefined, { ...callbacks, componentId })
                    }
                    callbacks={callbacks}
                    semanticChildren={buildGraph(otherChildren)
                        .filter((el: any) => el.type)
                        .map((el: any) => (
                            <AutoDynamicView
                                object={
                                    ['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id'])
                                        ? el
                                        : { uid: el.uid, type: el.type }
                                }
                                inline
                            />
                        ))}
                >
                    <div
                        key="editor-frame"
                        ref={editorRef}
                        tabIndex={-1}
                        onBlur={onBlurHandler}
                        onClickCapture={() => {
                            window.unigraph.getState('global/focused').setValue({
                                uid: data?.uid,
                                caret: 0,
                                type: '$/schema/embed_block',
                                component: componentId,
                            });
                        }}
                        onKeyDown={onKeyDownHandler}
                        style={{
                            width: '100%',
                            display: 'flex',
                            outline: 'none',
                            cursor: 'text',
                            ...(focused
                                ? {
                                      border: '1px solid #00bfff',
                                      margin: '-1px',
                                      borderRadius: '4px',
                                  }
                                : {}),
                        }}
                    >
                        <AutoDynamicView
                            object={data.get('content')?._value}
                            attributes={{
                                isHeading: !(isChildren || callbacks.isEmbed),
                            }}
                            noDrag
                            noContextMenu
                            inline
                            noClickthrough
                            callbacks={{
                                'get-semantic-properties': () => data,
                                isEmbed: true,
                            }}
                        />
                        <Typography
                            style={{
                                display: !isCollapsed ? 'none' : '',
                                marginLeft: '6px',
                                color: 'gray',
                                cursor: 'pointer',
                            }}
                            onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                setCollapsed(false);
                            }}
                        >{`(${subentities.length})`}</Typography>
                    </div>
                </NoteViewTextWrapper>
                {!isChildren && !callbacks.isEmbed ? (
                    <div style={{ marginTop: '4px', marginBottom: '12px', display: 'flex', color: 'gray' }}>
                        <Icon path={mdiClockOutline} size={0.8} style={{ marginRight: '4px' }} />
                        {`${new Date(data._updatedAt || 0).toLocaleString()} (${Sugar.Date.relative(
                            new Date(data._updatedAt || 0),
                        )})`}
                    </div>
                ) : (
                    []
                )}
                <BlockChildren
                    isCollapsed={isCollapsed}
                    isChildren={isChildren}
                    subentities={subentities}
                    tabContext={tabContext}
                    data={data}
                    isChildrenCollapsed={isChildrenCollapsed}
                    setIsChildrenCollapsed={setIsChildrenCollapsed}
                    editorContext={editorContext}
                    displayAs={displayAs}
                    childrenDisplayAs={childrenDisplayAs}
                    callbacks={callbacks}
                    copyOrCutHandler={copyOrCutHandler}
                />
                {!isChildren ? <ParentsAndReferences data={data} /> : []}
            </div>
        </NoteViewPageWrapper>
    );
}

export const getSubentities = (data: any) => {
    let subentities: any;
    let otherChildren: any;
    if (!data?._value?.children?.['_value[']) {
        [subentities, otherChildren] = [[], []];
    } else {
        [subentities, otherChildren] = data?._value?.children?.['_value['].sort(byElementIndex).reduce(
            (prev: any, el: any) => {
                if (el?._value?.type?.['unigraph.id'] !== '$/schema/subentity' && !el._key)
                    return [prev[0], [...prev[1], el._value]];
                if (!el._key) return [[...prev[0], el?._value._value], prev[1]];
                return prev;
            },
            [[], []],
        ) || [[], []];
    }
    return [subentities, otherChildren];
};

export const ReferenceNoteView = ({ data, callbacks, noChildren }: any) => {
    const [subentities, otherChildren] = getSubentities(data);

    const [pathNames, setPathNames] = React.useState<any[]>([]);
    const [refObjects, setRefObjects] = React.useState([{}]);

    React.useEffect(() => {
        removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
        let targetObj = data;
        const paths = [];
        let its = 0;
        while (its < 1000) {
            let path;
            its += 1;
            [targetObj, path] = findUid(data, callbacks?.context?.uid);
            if (targetObj?.uid) delete targetObj.uid;
            else break;
            paths.push(path);
        }
        const refinedPaths = paths
            .map((path) =>
                path.filter(
                    (el: any) =>
                        !['$/schema/subentity', '$/schema/interface/semantic'].includes(el?.type?.['unigraph.id']),
                ),
            )
            .filter(
                (path) =>
                    path.filter(
                        (el: any) =>
                            ['$/schema/note_block', '$/schema/embed_block'].includes(el?.type?.['unigraph.id']) &&
                            el?._hide !== true,
                    ).length <= 2,
            );
        setRefObjects(refinedPaths.map((refinedPath) => refinedPath[refinedPath.length - 2]));
        setPathNames(
            refinedPaths.map((refinedPath: any) =>
                refinedPath
                    .map((el: any) => new UnigraphObject(el)?.get('text')?.as('primitive'))
                    .filter(Boolean)
                    .slice(0, noChildren ? undefined : -2),
            ),
        );
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flexGrow: 1 }}>
                <Typography
                    variant="body1"
                    style={{ cursor: 'pointer' }}
                    onClick={(ev) => {
                        window.wsnavigator(`/library/object?uid=${data.uid}&type=${data?.type?.['unigraph.id']}`);
                    }}
                >
                    {data?._hide ? (
                        []
                    ) : (
                        <Icon
                            path={mdiNoteOutline}
                            size={0.8}
                            style={{ opacity: 0.54, marginRight: '4px', verticalAlign: 'text-bottom' }}
                        />
                    )}
                    <AutoDynamicView
                        object={data.get('text')?._value._value}
                        noDrag
                        noDrop
                        inline
                        noContextMenu
                        callbacks={{
                            'get-semantic-properties': () => data,
                        }}
                    />
                </Typography>
                {refObjects?.map((refObject: any, index: number) => (
                    <div style={{ marginBottom: '16px' }}>
                        <Typography style={{ color: 'gray' }}>{pathNames[index]?.join(' > ')}</Typography>
                        <div style={{ marginLeft: '16px' }}>
                            {noChildren ? (
                                []
                            ) : (
                                <OutlineComponent isChildren>
                                    <AutoDynamicView
                                        object={refObject}
                                        noClickthrough
                                        noSubentities
                                        components={childrenComponents}
                                        attributes={{
                                            isChildren: true,
                                        }}
                                    />
                                </OutlineComponent>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div>
                {otherChildren.map((el: any) => (
                    <AutoDynamicView object={el} inline />
                ))}
            </div>
        </div>
    );
};

export const NoChildrenReferenceNoteView = ({ data, callbacks }: any) => (
    <ReferenceNoteView data={data} callbacks={callbacks} noChildren />
);
