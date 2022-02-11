/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-param-reassign */
import { Typography } from '@mui/material';
import React from 'react';
import _ from 'lodash';
import { buildGraph, findUid, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { FiberManualRecord, MoreVert } from '@mui/icons-material';
import stringify from 'json-stable-stringify';
import { mdiClockOutline, mdiNoteOutline } from '@mdi/js';
import { Icon } from '@mdi/react';
import Sugar from 'sugar';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { ViewViewDetailed } from '../../components/ObjectView/DefaultObjectView';

import { addChild, copyChildToClipboard } from './commands';
import { onUnigraphContextMenu } from '../../components/ObjectView/DefaultObjectContextMenu';
import { noteQuery, noteQueryDetailed } from './noteQuery';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { removeAllPropsFromObj, scrollIntoViewIfNeeded, TabContext } from '../../utils';
import { DragandDrop } from '../../components/ObjectView/DragandDrop';
import { setClipboardHandler } from '../../clipboardUtils';
import { getCallbacks, getSubentities, getShortcuts, noteBlockCommands, persistCollapsedNodes } from './utils';
import { PlaceholderNoteBlock } from './NoteBlockViews';
import { useNoteEditor } from './NoteEditor';
import todoItemPlugin from './contrib/todoItem';
import { useSubscriptionDelegate } from '../../components/ObjectView/AutoDynamicView/SubscriptionDelegate';

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
        options={{
            noDrag: true,
            noContextMenu: true,
            compact: true,
            allowSubentity: true,
            customBoundingBox: true,
            noClickthrough: true,
            expandedChildren: true,
            noSubentities: ['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id']),
            noBacklinks: ['$/schema/note_block', '$/schema/embed_block'].includes(el.type?.['unigraph.id']),
        }}
        object={el}
        index={elindex}
        shortcuts={shortcuts}
        callbacks={callbacks}
        components={childrenComponents}
        attributes={{
            isChildren: true,
            isCollapsed,
            displayAs,
            setCollapsed,
        }}
    />
);

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
                        options: {
                            noClickthrough: true,
                            noSubentities: true,
                            noContextMenu: true,
                            noBacklinks: true,
                        },
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
                        options: {
                            noClickthrough: true,
                            noSubentities: true,
                            noContextMenu: true,
                            noBacklinks: true,
                        },
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

export function DetailedOutlinerBlock({
    data,
    isChildren,
    callbacks,
    isCollapsed,
    setCollapsed,
    focused,
    index,
    componentId,
    displayAs,
    noteEditorProps,
    onFocus,
    onPointerUp,
    onKeyDown,
    editorFrameStyle,
    beforeEditor,
    customView,
    pullText,
    pushText,
}: any) {
    const tabContext = React.useContext(TabContext);
    // eslint-disable-next-line no-bitwise
    isChildren |= callbacks?.isChildren;
    const [subentities, otherChildren] = getSubentities(data);
    const [command, setCommand] = React.useState<() => any | undefined>();
    const editorRef = React.useRef<any>();
    const edited = React.useRef(false);
    const [isEditing, setIsEditing] = React.useState(
        noteEditorProps ? window.unigraph.getState('global/focused').value?.uid === data.uid : false,
    );
    const nodesState = window.unigraph.addState(`${tabContext.viewId}/nodes`, []);
    const editorContext = {
        edited: noteEditorProps ? edited : undefined,
        setCommand,
        callbacks,
        nodesState,
    };

    const resetEdited = () => {
        edited.current = false;
        setTimeout(() => {
            commandFn();
        });
    };

    const [NoteEditorInner, setCurrentText, getCurrentText, onBlur, textInput] =
        (pullText &&
            pushText &&
            noteEditorProps?.(
                pullText,
                pushText,
                isEditing,
                setIsEditing,
                edited,
                focused,
                data,
                callbacks,
                componentId,
                editorContext,
                resetEdited,
                setCommand,
            )) ||
        [];

    const onBlurHandler = React.useCallback(() => {
        // setIsEditing(false);
        // inputDebounced.current.flush();
        if (onBlur) onBlur();
        if (focused && window.unigraph.getState('global/focused').value.component === componentId) {
            window.unigraph.getState('global/focused').setValue({ uid: '', caret: 0, type: '' });
        }
    }, [focused]);

    const commandFn = () => {
        if (edited.current !== true && command) {
            command();
            setCommand(undefined);
        }
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
    }, [JSON.stringify(subentities.map((el: any) => el.uid).sort()), data.uid, componentId, isCollapsed]);

    React.useEffect(() => {
        if (focused && onFocus) {
            onFocus(isEditing, setIsEditing, getCurrentText, textInput, edited, editorRef, editorContext);
        }
    }, [focused]);

    React.useEffect(() => {
        if (focused && textInput?.current) {
            scrollIntoViewIfNeeded(textInput.current);
        }
    }, [data.uid, index, focused]);

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

    React.useEffect(commandFn, [command]);

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
                                options={{ inline: true }}
                            />
                        ))}
                >
                    <div
                        key="editor-frame"
                        ref={editorRef}
                        tabIndex={textInput?.current ? undefined : -1}
                        onPointerUp={(ev) => {
                            if (textInput?.current && !isEditing) {
                                setIsEditing(true);
                            }
                            return onPointerUp(
                                ev,
                                isEditing,
                                setIsEditing,
                                getCurrentText,
                                textInput,
                                edited,
                                editorRef,
                                editorContext,
                            );
                        }}
                        onBlur={onBlurHandler}
                        onKeyDown={(ev) =>
                            onKeyDown?.(
                                ev,
                                isEditing,
                                setIsEditing,
                                getCurrentText,
                                textInput,
                                edited,
                                editorRef,
                                editorContext,
                            )
                        }
                        style={{
                            width: '100%',
                            display: 'flex',
                            cursor: 'text',
                            ...(editorFrameStyle || {}),
                        }}
                    >
                        {beforeEditor}
                        {NoteEditorInner}
                        {customView(
                            isEditing,
                            setIsEditing,
                            getCurrentText,
                            textInput,
                            edited,
                            editorRef,
                            editorContext,
                        )}
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
    const onPointerUpHandler = React.useCallback(
        (
            ev,
            isEditing: any,
            setIsEditing: any,
            getCurrentText: any,
            textInput: any,
            edited: any,
            editorRef: any,
            editorContext: any,
        ) => {
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
        [componentId, data?.uid],
    );

    const customView = React.useCallback(
        (
            isEditing: any,
            setIsEditing: any,
            getCurrentText: any,
            textInput: any,
            edited: any,
            editorRef: any,
            editorContext: any,
        ) => (
            <AutoDynamicView
                object={
                    edited.current
                        ? { ...data.get('text')?._value?._value, '_value.%': getCurrentText() }
                        : data.get('text')?._value?._value
                }
                attributes={{
                    isHeading: !(isChildren || callbacks.isEmbed),
                }}
                style={{ display: isEditing ? 'none' : '' }}
                options={{ inline: true, noDrag: true, noContextMenu: true, noClickthrough: true }}
                callbacks={{
                    'get-semantic-properties': () => data,
                }}
            />
        ),
        [data, isChildren, callbacks.isEmbed],
    );

    return (
        <DetailedOutlinerBlock
            data={data}
            isChildren={isChildren}
            callbacks={callbacks}
            options={options}
            isCollapsed={isCollapsed}
            setCollapsed={setCollapsed}
            focused={focused}
            index={index}
            componentId={componentId}
            displayAs={displayAs}
            pullText={() => data.get('text')?.as('primitive')}
            pushText={(text: string) => {
                return window.unigraph.updateObject(
                    new UnigraphObject(data).get('text')._value._value.uid,
                    {
                        '_value.%': text,
                    },
                    false,
                    false,
                    callbacks.subsId,
                    [],
                );
            }}
            noteEditorProps={useNoteEditor}
            onFocus={(
                isEditing: any,
                setIsEditing: any,
                getCurrentText: any,
                textInput: any,
                edited: any,
                editorRef: any,
                editorContext: any,
            ) => {
                window.unigraph.getState('global/focused/actions').setValue({
                    splitChild: () => {
                        // const sel = document.getSelection();
                        // const caret = _.min([sel?.anchorOffset, sel?.focusOffset]) as number;
                        callbacks['split-child'](getCurrentText(), textInput.current.selectionStart);
                    },
                    indentChild: callbacks['indent-child'],
                    unindentChild: callbacks['unindent-child-in-parent'],
                });
            }}
            onPointerUp={onPointerUpHandler}
            beforeEditor={
                isChildren && data._hide !== true ? (
                    <div
                        style={{ display: 'contents' }}
                        onClick={() => {
                            window.wsnavigator(`/library/object?uid=${data.uid}&type=${data?.type?.['unigraph.id']}`);
                        }}
                    >
                        <Icon path={mdiNoteOutline} size={0.8} style={{ opacity: 0.54, marginRight: '4px' }} />
                    </div>
                ) : (
                    []
                )
            }
            customView={customView}
        />
    );
}

export function DetailedEmbedBlock({
    data,
    isChildren,
    callbacks,
    isCollapsed,
    setCollapsed,
    focused,
    index,
    componentId,
    displayAs,
}: any) {
    const onPointerUpHandler = React.useCallback(
        (ev, isEditing, setIsEditing, getCurrentText, textInput) => {
            const caretPos = Number((ev.target as HTMLElement).getAttribute('markdownPos') || -1);
            (ev.target as HTMLElement).removeAttribute('markdownPos');
            const finalCaretPos = caretPos === -1 ? getCurrentText().length : caretPos;
            window.unigraph.getState('global/focused').setValue({
                ...window.unigraph.getState('global/focused').value,
                uid: data?.uid,
                type: '$/schema/embed_block',
                component: componentId,
                caret: finalCaretPos,
            });
        },
        [componentId, data?.uid],
    );

    const [getObject, subsId] = useSubscriptionDelegate(
        data.get('content')?._value?.uid,
        window.unigraph.getState('registry/dynamicView').value?.[data.get('content')?._value?.type?.['unigraph.id']],
        data.get('content')?._value,
    );

    const editor: any = {};
    if (data.get('content')?._value?.type?.['unigraph.id'] === '$/schema/todo') {
        editor.hook = useNoteEditor;
        editor.pullText = todoItemPlugin.pullText.bind(null, getObject());
        editor.pushText = todoItemPlugin.pushText.bind(null, subsId, getObject());
    }

    const onKeyDownHandler = React.useCallback(
        (
            ev,
            isEditing: any,
            setIsEditing: any,
            getCurrentText: any,
            textInput: any,
            edited: any,
            editorRef: any,
            editorContext: any,
        ) => {
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
        [callbacks, componentId, data],
    );

    const customView = React.useCallback(
        (
            isEditing: any,
            setIsEditing: any,
            getCurrentText: any,
            textInput: any,
            edited: any,
            editorRef: any,
            editorContext: any,
        ) =>
            isEditing ? undefined : (
                <AutoDynamicView
                    object={getObject()}
                    attributes={{
                        isHeading: !(isChildren || callbacks.isEmbed),
                    }}
                    options={{ inline: true, noDrag: true, noDrop: true, noClickthrough: true }}
                    callbacks={{
                        'get-semantic-properties': () => data,
                        isEmbed: true,
                        subsId,
                    }}
                />
            ),
        [data, isChildren, callbacks.isEmbed, getObject],
    );

    return (
        <DetailedOutlinerBlock
            data={data}
            isChildren={isChildren}
            callbacks={callbacks}
            isCollapsed={isCollapsed}
            setCollapsed={setCollapsed}
            focused={focused}
            index={index}
            componentId={componentId}
            displayAs={displayAs}
            noteEditorProps={editor.hook}
            pullText={editor.pullText}
            pushText={editor.pushText}
            onFocus={(
                isEditing: any,
                setIsEditing: any,
                getCurrentText: any,
                textInput: any,
                edited: any,
                editorRef: any,
                editorContext: any,
            ) => {
                if (!editor.hook) editorRef.current.focus();
                window.unigraph.getState('global/focused/actions').setValue({
                    splitChild: () => {
                        callbacks['add-child']();
                    },
                    indentChild: callbacks['indent-child'],
                    unindentChild: callbacks['unindent-child-in-parent'],
                });
            }}
            onPointerUp={onPointerUpHandler}
            onKeyDown={editor.hook ? undefined : onKeyDownHandler}
            editorFrameStyle={
                focused
                    ? {
                          border: '1px solid #00bfff',
                          margin: '-1px',
                          outline: 'none',
                          borderRadius: '4px',
                      }
                    : { outline: 'none' }
            }
            customView={customView}
        />
    );
}

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
                        options={{ inline: true, noDrag: true, noDrop: true, noContextMenu: true }}
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
                                        callbacks={{ isEmbed: true }}
                                        options={{ noClickthrough: true, noSubentities: true }}
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
                    <AutoDynamicView object={el} options={{ inline: true }} />
                ))}
            </div>
        </div>
    );
};

export const NoChildrenReferenceNoteView = ({ data, callbacks }: any) => (
    <ReferenceNoteView data={data} callbacks={callbacks} noChildren />
);
