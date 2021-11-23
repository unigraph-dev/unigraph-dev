import { Typography } from "@material-ui/core";
import React, { FormEvent } from "react";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";
import { ViewViewDetailed } from "../../components/ObjectView/DefaultObjectView";

import _ from "lodash";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { Actions } from "flexlayout-react";
import { addChild, convertChildToTodo, focusLastDFSNode, focusNextDFSNode, indentChild, setCaret, setFocus, splitChild, unindentChild, unsplitChild, replaceChildWithUid } from "./commands";
import { onUnigraphContextMenu } from "../../components/ObjectView/DefaultObjectContextMenu";
import { FiberManualRecord, MoreVert } from "@material-ui/icons";
import { setSearchPopup } from "./searchPopup";
import { noteQuery } from "./init";

export const getSubentities = (data: any) => {
    let subentities: any, otherChildren: any;
    if (!(data?.['_value']?.['children']?.['_value['])) {
        [subentities, otherChildren] = [[], []];
    } else {
        [subentities, otherChildren] = data?.['_value']?.['children']?.['_value['].sort(byElementIndex).reduce((prev: any, el: any) => {
            if ('$/schema/subentity' !== el?.['_value']?.type?.['unigraph.id'] && !el['_key']) return [prev[0], [...prev[1], el['_value']]];
            else if (!el['_key']) return [[...prev[0], el?.['_value']['_value']], prev[1]];
            else return prev;
        }, [[], []])
    }
    return [subentities, otherChildren];
}

export const NoteBlock = ({ data }: any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const unpadded = unpad(data);

    return <div onClick={() => { window.wsnavigator(`/library/object?uid=${data.uid}&isStub=true&type=$/schema/note_block`) }} style={{display: "flex", alignItems: "center", width: "100%"}}>
        <div style={{flexGrow: 1}}>
            <Typography variant="body1">{unpadded.text}</Typography>
            <Typography variant="body2" color="textSecondary">{subentities.length ? " and " + subentities.length + " children" : " no children"}</Typography>
        </div>
        <div>
            {otherChildren.map((el: any) => <AutoDynamicView object={el} />)}
        </div>
    </div>
}

const onNoteInput = (inputDebounced: any, event: FormEvent<HTMLSpanElement>) => {
    const newInput = event.currentTarget.textContent;

    inputDebounced.current(newInput);
}

const noteBlockCommands = {
    "add-child": addChild,
    "set-focus": setFocus,
    "unsplit-child": unsplitChild,
    "split-child": splitChild,
    "indent-child": indentChild,
    "unindent-child": unindentChild,
    "convert-child-to-todo": convertChildToTodo,
    "replace-child-with-uid": replaceChildWithUid,
}

export const PlaceholderNoteBlock = ({ callbacks }: any) => {
    return <div style={{ width: "100%" }}>
        <Typography variant="body1" style={{ fontStyle: "italic" }}
            onClick={() => { callbacks['add-child'](); }}
        >Click here to start writing</Typography>
    </div>
}

export const OutlineComponent = ({ children, collapsed, setCollapsed, isChildren, createBelow }: any) => {
    return <div style={{ flex: "0 0 auto", display: "flex", alignItems: "baseline", position: "relative" }}>
        <div style={{ position: "absolute", left: "-4px" }} className="showOnHover" onClick={() => setCollapsed(!collapsed)}>O</div>
        <div style={{ position: "absolute", left: "-4px", top: "8px" }} className="showOnHover" onClick={() => createBelow()}>V</div>
        <div style={{ height: "100%", width: "1px", backgroundColor: "gray", position: "absolute", left: "-12px", display: isChildren ? "" : "none" }}></div>
        <FiberManualRecord style={{ fontSize: "0.5rem", marginLeft: "8px", marginRight: "8px", ...(collapsed ? { borderRadius: "4px", color: "lightgray", backgroundColor: "black" } : {}) }} />
        <div style={{ flexGrow: 1 }}>
            {children}
        </div>
    </div>
}

const NoteViewPageWrapper = ({ children, isRoot }: any) => {
    return !isRoot ? children : <div style={{ height: "100%", width: "100%", padding: "16px" }}>
        {children}
    </div>
}

const NoteViewTextWrapper = ({ children, semanticChildren, isRoot, onContextMenu }: any) => {
    return <div style={{ display: "flex", alignItems: "center" }}>
        {children}
        {semanticChildren}
        {isRoot ? <MoreVert onClick={onContextMenu} style={{marginLeft: "8px"}}/> : []}
    </div>
}

export const DetailedNoteBlock = ({ data, isChildren, callbacks, options, isCollapsed }: any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const [command, setCommand] = React.useState<() => any | undefined>();
    const inputter = (text: string) => {
        if (data?.['_value']?.['children']?.['_value[']) {
            let deadLinks: any = [];
            data['_value']['children']['_value['].forEach((el: any) => {
                if (el && el['_key'] && !text.includes(el['_key'])) deadLinks.push(el.uid)
            });
            if (deadLinks.length) window.unigraph.deleteItemFromArray(data['_value']['children']['uid'], deadLinks, data['uid'])
        }

        return window.unigraph.updateObject(data.uid, {
            text: { type: { 'unigraph.id': "$/schema/markdown" }, _value: text }
        });

    }
    /** Reference for the data object (for children) */
    const dataref = React.useRef<any>();
    /** Reference for text content as a string */
    const textref = React.useRef<any>();
    /** Reference for HTML Element for list of children */
    const childrenref = React.useRef<any>();
    /** Reference for the box of this element. Used for positioning only */
    const boxRef = React.useRef<any>();
    const inputDebounced = React.useRef(_.debounce(inputter, 1000))
    const setCurrentText = (text: string) => { textInput.current.textContent = text };
    const edited = React.useRef(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const textInput: any = React.useRef();
    const nodesState = window.unigraph.addState(`${options?.viewId || callbacks['get-view-id']()}/nodes`, [])
    const editorContext = {
        edited, setCommand, childrenref, callbacks, nodesState
    }

    

    //console.log(data);

    const [isChildrenCollapsed, setIsChildrenCollapsed] = React.useState<any>({});

    React.useEffect(() => {
        const newNodes = _.unionBy([{ uid: data.uid, children: subentities.map((el: any) => el.uid), root: !isChildren }], nodesState.value, 'uid');
        nodesState.setValue(newNodes)

        return function cleanup() { inputDebounced.current.flush(); }
    }, [data])

    React.useEffect(() => {
        dataref.current = data;
        const dataText = data.get('text').as('primitive')
        if (dataText && options?.viewId) window.layoutModel.doAction(Actions.renameTab(options.viewId, `Note: ${dataText}`))
        if (isEditing && textref.current !== dataText && !edited.current) { setCurrentText(dataText); textInput.current.textContent = dataText; }
        if (textref.current !== dataText && !edited.current) { textref.current = dataText; }
        else if ((textref.current === dataText && edited.current) || textref.current === undefined) edited.current = false;
    }, [data, isEditing])

    React.useEffect(() => {
        if (isEditing && textInput.current?.textContent === "" && data.get('text').as('primitive')) { textInput.current.textContent = textref.current }
    }, [isEditing])

    React.useEffect(() => {
        if (!edited.current && command) {
            command();
            setCommand(undefined);
        }
    }, [command])

    return <NoteViewPageWrapper isRoot={!isChildren}>
        <div style={{ width: "100%", }} ref={boxRef} >
            <NoteViewTextWrapper 
                isRoot={!isChildren} onContextMenu={(event: any) => onUnigraphContextMenu(event, data, undefined, callbacks)} 
                semanticChildren={buildGraph(otherChildren).filter((el: any) => el.type).map((el: any) => <AutoDynamicView object={el.type?.['unigraph.id'] === "$/schema/note_block" ? el : {uid: el.uid, type: el.type}} style={{width: "unset"}}/>)}
            >
                <div onPointerUp={(ev) => {
                    if (!isEditing) {
                        setIsEditing(true);
                        const caretPos = Number((ev.target as HTMLElement).getAttribute("markdownPos") || 0);
                        setTimeout(() => {
                            if (textInput.current.firstChild) {
                                setCaret(document, textInput.current.firstChild, caretPos || textInput.current?.textContent?.length)
                            } else {
                                setCaret(document, textInput.current, 0);
                            }
                        }, 0)
                    }
                }} onClick={(ev) => {
                    if (!isEditing) {
                        setIsEditing(true);
                        const caretPos = Number((ev.target as HTMLElement).getAttribute("markdownPos") || 0);
                        setTimeout(() => {
                            if (textInput.current.firstChild) {
                                setCaret(document, textInput.current.firstChild, caretPos || textInput.current?.textContent?.length)
                            } else {
                                setCaret(document, textInput.current, 0);
                            }
                        }, 0)
                    }
                }}
                onBlur={(ev) => { setIsEditing(false); inputDebounced.current.flush(); }} style={{ width: "100%" }}>

                    {(isEditing) ? <Typography
                        variant={isChildren ? "body1" : "h4"}
                        onContextMenu={isChildren ? undefined : (event) => onUnigraphContextMenu(event, data, undefined, callbacks)}
                        contentEditable={true}
                        style={{outline: "0px solid transparent"}}
                        suppressContentEditableWarning={true}
                        ref={textInput}
                        onInput={(ev) => {

                            if (ev.currentTarget.textContent !== data.get('text').as('primitive') && !edited.current) edited.current = true
                            const newContent = ev.currentTarget.textContent;
                            const caret = (document.getSelection()?.anchorOffset) as number;
                            // Check if inside a reference block
                            const placeholder = /\[\[([^[\]]*)\]\]/g;
                            const placeholder2 = /\(\(([^[\)]*)\)\)/g;

                            let hasMatch = false;
                            for (let match: any; (match = placeholder.exec(textInput.current.textContent)) !== null;) {
                                if (match.index <= caret && placeholder.lastIndex >= caret) {
                                    hasMatch = true;
                                    //inputDebounced.cancel();
                                    setSearchPopup(boxRef, match[1], async (newName: string, newUid: string) => {
                                        const newStr = newContent?.slice?.(0, match.index) + '[[' + newName + ']]' + newContent?.slice?.(match.index + match[0].length);
                                        //console.log(newName, newUid, newStr, newContent);
                                        // This is an ADDITION operation
                                        //console.log(data);
                                        const semChildren = data?.['_value'];
                                        //inputDebounced.cancel();
                                        await window.unigraph.updateObject(data.uid, {
                                            '_value': {
                                                'text': { '_value': { '_value': { '_value.%': newStr } } },
                                                children: {
                                                    '_value[': [{
                                                        '_index': { '_value.#i': semChildren?.['children']?.['_value[']?.length || 0 },
                                                        '_key': `[[${newName}]]`,
                                                        '_value': {
                                                            'dgraph.type': ['Interface'],
                                                            'type': { 'unigraph.id': '$/schema/interface/semantic' },
                                                            '_hide': true,
                                                            '_value': { uid: newUid },
                                                        }
                            
                                                    }]
                                                }
                                            }
                                        }, true, false);
                                        window.unigraph.getState('global/searchPopup').setValue({ show: false });
                                    })
                                }
                            }
                            for (let match: any; (match = placeholder2.exec(textInput.current.textContent)) !== null;) {
                                if (match.index <= caret && placeholder2.lastIndex >= caret) {
                                    hasMatch = true;
                                    setSearchPopup(boxRef, match[1], async (newName: string, newUid: string) => {
                                        callbacks['replace-child-with-uid'](newUid);
                                        window.unigraph.getState('global/searchPopup').setValue({ show: false });
                                    })
                                }
                            }
                            if (!hasMatch) window.unigraph.getState('global/searchPopup').setValue({ show: false })

                            textref.current = ev.currentTarget.textContent;
                            onNoteInput(inputDebounced, ev);
                        }}
                        onKeyDown={async (ev) => {
                            const sel = document.getSelection();
                            const caret = _.min([sel?.anchorOffset, sel?.focusOffset]) as number;
                            switch (ev.code) {
                                case 'Enter':
                                    ev.preventDefault();
                                    edited.current = false;
                                    inputDebounced.current.cancel();
                                    setCommand(() => callbacks['split-child']?.bind(this, textref.current || data.get('text').as('primitive'), caret))
                                    break;

                                case 'Tab':
                                    ev.preventDefault();
                                    inputDebounced.current.flush();
                                    if (ev.shiftKey) {
                                        setCommand(() => callbacks['unindent-child-in-parent']?.bind(this))
                                    } else {
                                        setCommand(() => callbacks['indent-child']?.bind(this));
                                    }
                                    break;

                                case 'Backspace':
                                    //console.log(caret, document.getSelection()?.type)
                                    if (caret === 0 && document.getSelection()?.type === "Caret" && !(textref.current).length) {
                                        ev.preventDefault();
                                        //inputDebounced.cancel();
                                        edited.current = false;
                                        setCommand(() => callbacks['unsplit-child'].bind(this));
                                    }
                                    break;

                                case 'ArrowUp':
                                    ev.preventDefault();
                                    inputDebounced.current.flush();
                                    setCommand(() => callbacks['focus-last-dfs-node'].bind(this, data, editorContext, 0))
                                    break;

                                case 'ArrowDown':
                                    ev.preventDefault();
                                    inputDebounced.current.flush();
                                    setCommand(() => callbacks['focus-next-dfs-node'].bind(this, data, editorContext, 0))
                                    break;

                                case 'BracketLeft':
                                    if (!ev.shiftKey) {
                                        ev.preventDefault();
                                        //console.log(document.getSelection())
                                        let middle = document.getSelection()?.toString() || "";
                                        let end = "";
                                        if (middle.endsWith(' ')) { middle = middle.slice(0, middle.length - 1); end = " "; }
                                        document.execCommand('insertText', false, '[' + middle + ']' + end);
                                        //console.log(caret, document.getSelection(), middle)
                                        setCaret(document, textInput.current.firstChild, caret + 1, middle.length)
                                    }
                                    break;

                                case 'Digit9':
                                    if (ev.shiftKey) {
                                        ev.preventDefault();
                                        //console.log(document.getSelection())
                                        let middle = document.getSelection()?.toString() || "";
                                        let end = "";
                                        if (middle.endsWith(' ')) { middle = middle.slice(0, middle.length - 1); end = " "; }
                                        document.execCommand('insertText', false, '(' + middle + ')' + end);
                                        //console.log(caret, document.getSelection(), middle)
                                        setCaret(document, textInput.current.firstChild, caret + 1, middle.length)
                                    }
                                    break;

                                default:
                                    //console.log(ev);
                                    break;
                            }
                        }}
                    >
                    </Typography> : <AutoDynamicView
                        object={data.get('text')['_value']['_value']}
                        attributes={{ isHeading: !isChildren }}
                        noDrag noContextMenu
                        callbacks={{
                            'get-semantic-properties': () => {
                                return data;
                            }
                        }}
                    />}
                </div>
            </NoteViewTextWrapper>
            {!isChildren ? <div style={{ height: "12px" }} /> : []}
            {!(isCollapsed === true) ? <div ref={childrenref} style={{ width: "100%" }} >
                {(subentities.length || isChildren) ? buildGraph(subentities).map((el: any, elindex) => {
                    const isCol = isChildrenCollapsed[el.uid];
                    console.log(el.type);
                    return <OutlineComponent key={el.uid} isChildren={isChildren} collapsed={isCol} setCollapsed={(val: boolean) => setIsChildrenCollapsed({ ...isChildrenCollapsed, [el.uid]: val })}
                        createBelow={() => { addChild(dataref.current, editorContext) }}
                    >
                        <AutoDynamicView
                            object={el.type?.['unigraph.id'] === "$/schema/note_block" ? el : {uid: el.uid, type: el.type}}
                            callbacks={{
                                "get-view-id": () => options?.viewId, // only used at root
                                ...callbacks,
                                ...Object.fromEntries(Object.entries(noteBlockCommands).map(([k, v]: any) => [k, (...args: any[]) => v(dataref.current, editorContext, elindex, ...args)])),
                                "unindent-child-in-parent": () => { callbacks['unindent-child'](elindex) },
                                "focus-last-dfs-node": focusLastDFSNode,
                                "focus-next-dfs-node": focusNextDFSNode,
                                "dataref": dataref,
                                isEmbed: true
                            }}
                            component={{ "$/schema/note_block": {view: DetailedNoteBlock, query: noteQuery}, "$/schema/view": {view: ViewViewDetailed} }} attributes={{ isChildren: true, isCollapsed: isCol }} allowSubentity
                            style={el.type?.['unigraph.id'] === "$/schema/note_block" ? {} :
                                { border: "lightgray", borderStyle: "solid", borderWidth: 'thin', margin: "4px", borderRadius: "8px", minWidth: "calc(100% - 8px)" }}
                        />
                    </OutlineComponent>
                }) : <OutlineComponent isChildren={isChildren}>
                    <PlaceholderNoteBlock callbacks={{ "add-child": () => noteBlockCommands['add-child'](dataref.current, editorContext) }} />
                </OutlineComponent>}
            </div> : []}
        </div>
    </NoteViewPageWrapper>
}
