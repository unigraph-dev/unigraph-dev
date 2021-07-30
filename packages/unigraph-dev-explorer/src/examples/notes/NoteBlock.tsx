import { MenuItem, Typography } from "@material-ui/core";
import React, { FormEvent } from "react";
import { registerDetailedDynamicViews, registerDynamicViews, registerContextMenuItems } from "unigraph-dev-common/lib/api/unigraph-react";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView, ViewViewDetailed } from "../../components/ObjectView/DefaultObjectView";

import _ from "lodash";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { Actions } from "flexlayout-react";
import { addChild, convertChildToTodo, focusLastDFSNode, focusNextDFSNode, focusUid, getSemanticChildren, indentChild, setCaret, setFocus, splitChild, unindentChild, unsplitChild } from "./commands";
import { onUnigraphContextMenu } from "../../components/ObjectView/DefaultObjectContextMenu";
import { FiberManualRecord } from "@material-ui/icons";

export const getSubentities = (data: any) => {
    let subentities: any, otherChildren: any;
    if (!(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['])) {
        [subentities, otherChildren] = [[], []];
    } else {
        [subentities, otherChildren] = data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['].sort(byElementIndex).reduce((prev: any, el: any) => {
            if ('$/schema/subentity' !== el?.['_value']?.['_value']?.type?.['unigraph.id'] && !el['_key']) return [prev[0], [...prev[1], el['_value']]];
            else if (!el['_key']) return [[...prev[0], el['_value']?.['_value']['_value']], prev[1]];
            else return prev;
        }, [[], []])
    }
    return [subentities, otherChildren];
}



export const NoteBody = ({text, children}: any) => {
    return <div>
        <Typography variant="body1">{text}</Typography>
        {children.map((el: any) => <AutoDynamicView object={el} />)}
    </div>
}

export const NoteBlock = ({data} : any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const unpadded = unpad(data);

    return <div onClick={() => {window.wsnavigator(`/library/object?uid=${data.uid}`)}}>
        <NoteBody text={unpadded.text} children={otherChildren} />
        <Typography variant="body2" color="textSecondary">{subentities.length ? " and " + subentities.length + " children" : " no children"}</Typography>
    </div>
}

const onNoteInput = (inputDebounced: any, event: FormEvent<HTMLSpanElement>) => {
    const newInput = event.currentTarget.textContent;

    inputDebounced(newInput);
}

const noteBlockCommands = {
    "add-child": addChild,
    "set-focus": setFocus,
    "unsplit-child": unsplitChild,
    "split-child": splitChild,
    "indent-child": indentChild,
    "unindent-child": unindentChild,
    "convert-child-to-todo": convertChildToTodo,
}

export const PlaceholderNoteBlock = ({ callbacks }: any) => {
    return <div style={{width: "100%"}}>
        <Typography variant="body1" style={{fontStyle: "italic"}}
            onClick={() => {callbacks['add-child']();}}
        >Click here to start writing</Typography>
    </div>
}

export const OutlineComponent = ({children, collapsed, setCollapsed, isChildren}: any) => {
    return <div style={{flex: "0 0 auto", display: "flex", alignItems: "baseline", position: "relative"}}>
        <div style={{position: "absolute", left: "-4px"}} className="showOnHover" onClick={() => setCollapsed(!collapsed)}>O</div>
        <div style={{height: "100%", width: "1px", backgroundColor: "gray", position: "absolute", left: "-12px", display: isChildren ? "" : "none"}}></div>
        <FiberManualRecord style={{fontSize: "0.5rem", marginLeft: "8px", marginRight: "8px", ...(collapsed ? {borderRadius: "4px", color: "lightgray", backgroundColor: "black"} : {})}}/>
        <div style={{flexGrow: 1}}>
            {children}
        </div>
    </div>
}

export const DetailedNoteBlock = ({data, isChildren, callbacks, options, isCollapsed}: any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const [command, setCommand] = React.useState<() => any | undefined>();
    const inputter = (text: string) => {
        if (data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value[']) {
            let deadLinks: any = [];
            data['_value']['semantic_properties']['_value']['_value']['children']['_value['].forEach((el: any) => {
                if (el && el['_key'] && !text.includes(el['_key'])) deadLinks.push(el.uid)
            });
            if (deadLinks.length) window.unigraph.deleteItemFromArray(data['_value']['semantic_properties']['_value']['_value']['children']['uid'], deadLinks, data['uid'])
        }

        return window.unigraph.updateObject(data.uid, {
            text: {type: {'unigraph.id': "$/schema/markdown"}, _value: text}
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
    const inputDebounced = React.useRef(_.throttle(inputter, 1000)).current
    const setCurrentText = (text: string) => {textInput.current.textContent = text};
    const [edited, setEdited] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const textInput: any = React.useRef();
    const nodesState = window.unigraph.addState(`${options?.viewId || callbacks['get-view-id']()}/nodes`, [])
    const editorContext = {
        setEdited, setCommand, childrenref, callbacks, nodesState
    }
    
    const [isChildrenCollapsed, setIsChildrenCollapsed] = React.useState<any>({});

    React.useEffect(() => {
        const newNodes = _.unionBy([{uid: data.uid, children: subentities.map((el: any) => el.uid), root: !isChildren}], nodesState.value, 'uid');
        nodesState.setValue(newNodes)
    }, [data])

    React.useEffect(() => {
        dataref.current = data;
        const dataText = data.get('text').as('primitive')
        if (dataText && options?.viewId) window.layoutModel.doAction(Actions.renameTab(options.viewId, `Note: ${dataText}`))
        if (isEditing && textref.current !== dataText && !edited) {setCurrentText(dataText); textInput.current.textContent = dataText;}
        else if ((textref.current === dataText && edited) || textref.current === undefined) setEdited(false);
    }, [data, isEditing])

    React.useEffect(() => {
        if (isEditing && textInput.current?.textContent === "" && data.get('text').as('primitive')) {textInput.current.textContent = textref.current}
    }, [isEditing])

    React.useEffect(() => {
        if (!edited && command) {
            command();
            setCommand(undefined);
        }
    }, [command, edited])

    return <div style={{width: "100%"}} ref={boxRef} >
        <div onClick={(ev) => { if (!isEditing) {
                setIsEditing(true);
                const caretPos = Number((ev.target as HTMLElement).getAttribute("markdownPos") || 0);
            
                setTimeout(() => {
                    textInput.current?.focus()
                    
                    if (textInput.current.firstChild) {
                        setCaret(document, textInput.current.firstChild, caretPos || textInput.current?.textContent?.length)
                    }
                }, 0)
            }}} onBlur={(ev) => {setIsEditing(false)}}>
            {(isEditing) ? <Typography 
                variant={isChildren ? "body1" : "h4"} 
                onContextMenu={isChildren ? undefined : (event) => onUnigraphContextMenu(event, data, undefined, callbacks)}
                contentEditable={true} 
                suppressContentEditableWarning={true}
                ref={textInput}
                onInput={(ev) => {
                    
                    if (ev.currentTarget.textContent !== data.get('text').as('primitive') && !edited) setEdited(true)
                    const newContent = ev.currentTarget.textContent;
                    const caret = (document.getSelection()?.anchorOffset) as number;
                    // Check if inside a reference block
                    const placeholder = /\[\[([^[\]]*)\]\]/g;

                    let hasMatch = false;
                    for (let match: any; (match = placeholder.exec(textInput.current.textContent)) !== null;) {
                        if (match.index <= caret && placeholder.lastIndex >= caret) {
                            hasMatch = true;
                            inputDebounced.flush();
                            window.unigraph.getState('global/searchPopup').setValue({show: true, search: match[1], anchorEl: boxRef.current,
                                onSelected: async (newName: string, newUid: string) => {
                                    const newStr = newContent?.slice?.(0, match.index) + '[[' + newName + ']]' + newContent?.slice?.(match.index+match[0].length);
                                    //console.log(newName, newUid, newStr, newContent);
                                    // This is an ADDITION operation
                                    //console.log(data);
                                    const semChildren = data?.['_value']?.['semantic_properties']?.['_value']?.['_value'];
                                    await window.unigraph.updateObject(data.uid, {
                                        '_value': {
                                            'text': {'_value': {'_value': {'_value.%': newStr}}},
                                            'semantic_properties': {
                                                '_propertyType': "inheritance",
                                                "_value": {
                                                    'dgraph.type': ['Entity'],
                                                    'type': {'unigraph.id': '$/schema/semantic_properties'},
                                                    '_propertyType': "inheritance",
                                                    "_value": {
                                                        children: {
                                                            '_value[': [{
                                                                '_index': {'_value.#i': semChildren?.['children']?.['_value[']?.length || 0},
                                                                '_key': `[[${newName}]]`,
                                                                '_value': {
                                                                    'dgraph.type': ['Interface'],
                                                                    'type': {'unigraph.id': '$/schema/interface/semantic'},
                                                                    '_hide': true,
                                                                    '_value': {uid: newUid},
                                                                }
                                                                
                                                            }]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }, true, false);
                                    window.unigraph.getState('global/searchPopup').setValue({show: false});
                                }, default: [{
                                    label: (search: string) => `Create new page named ${search}`,
                                    onSelected: async (search: string) => {
                                        const newUid = await window.unigraph.addObject({
                                            'text': {_value: search, type: {'unigraph.id': "$/schema/markdown"}}
                                        }, '$/schema/note_block');
                                        //console.log(newUid);
                                        return newUid[0];
                                    }
                                }, {
                                    label: (search: string) => `Create new tag and page named ${search}`,
                                    onSelected: async (search: string) => {
                                        const newTagUid = await window.unigraph.addObject({
                                            'name': search
                                        }, '$/schema/tag');
                                        window.unigraph.addObject({
                                            'text': {type: {'unigraph.id': "$/schema/markdown"}, _value: search},
                                            semantic_properties: {
                                                children: [{
                                                    "type": {"unigraph.id": '$/schema/tag'},
                                                    uid: newTagUid[0]
                                                }]
                                            }
                                        }, '$/schema/note_block');
                                        return newTagUid[0];
                                    }
                                }]
                            })
                        }
                    }
                    if (!hasMatch) window.unigraph.getState('global/searchPopup').setValue({show: false})

                    textref.current = ev.currentTarget.textContent; 
                    onNoteInput(inputDebounced, ev); 
                }}
                onKeyDown={async (ev) => {
                    const sel = document.getSelection();
                    const caret = _.min([sel?.anchorOffset, sel?.focusOffset]) as number;
                    switch (ev.code) {
                        case 'Enter':
                            ev.preventDefault();
                            inputDebounced.flush();
                            setCommand(() => callbacks['split-child']?.bind(this, caret))
                            break;
                        
                        case 'Tab':
                            ev.preventDefault();
                            inputDebounced.flush();
                            if (ev.shiftKey) {
                                setCommand(() => callbacks['unindent-child-in-parent']?.bind(this))
                            } else {
                                setCommand(() => callbacks['indent-child']?.bind(this));
                            }
                            break;

                        case 'Backspace':
                            //console.log(caret, document.getSelection()?.type)
                            if (caret === 0 && document.getSelection()?.type === "Caret") {
                                ev.preventDefault();
                                inputDebounced.flush();
                                setCommand(() => callbacks['unsplit-child'].bind(this));
                            }
                            break;
                        
                        case 'ArrowUp':
                            ev.preventDefault();
                            inputDebounced.flush();
                            setCommand(() => callbacks['focus-last-dfs-node'].bind(this, data, editorContext, 0))
                            break;
                        
                        case 'ArrowDown':
                            ev.preventDefault();
                            inputDebounced.flush();
                            setCommand(() => callbacks['focus-next-dfs-node'].bind(this, data, editorContext, 0))
                            break;

                        case 'BracketLeft':
                            ev.preventDefault();
                            //console.log(document.getSelection())
                            let middle = document.getSelection()?.toString() || "";
                            let end = "";
                            if (middle.endsWith(' ')) {middle = middle.slice(0, middle.length-1); end = " ";}
                            document.execCommand('insertText', false, '['+middle+']'+end);
                            //console.log(caret, document.getSelection(), middle)
                            setCaret(document, textInput.current.firstChild, caret+1, middle.length)
                            break;
                    
                        default:
                            //console.log(ev);
                            break;
                    }
                }}
            >
            </Typography> : <AutoDynamicView 
                object={data.get('text')['_value']['_value']} 
                attributes={{isHeading: !isChildren}} 
                noDrag noContextMenu 
                callbacks={{'get-semantic-properties': () => {
                    return data?.['_value']?.['semantic_properties']?.['_value'];
                }}}
            />}
        </div>
        {!isChildren ? <div style={{height: "12px"}}/>: []}
        {buildGraph(otherChildren).filter((el: any) => el.type).map((el: any) => <AutoDynamicView object={el}/>)}
        {!(isCollapsed === true) ? <div ref={childrenref} style={{width: "100%"}} >
            {(subentities.length || isChildren) ? buildGraph(subentities).map((el: any, elindex) => {
                const isCol = isChildrenCollapsed[el.uid];
                return <OutlineComponent key={el.uid} isChildren={isChildren} collapsed={isCol} setCollapsed={(val: boolean) => setIsChildrenCollapsed({...isChildrenCollapsed, [el.uid]: val})}>
                    <AutoDynamicView 
                        object={el}
                        callbacks={{
                            "get-view-id": () => options?.viewId, // only used at root
                            ...callbacks,
                            ...Object.fromEntries(Object.entries(noteBlockCommands).map(([k, v]: any) => [k, (...args: any[]) => v(dataref.current, editorContext, elindex, ...args)])), 
                            "unindent-child-in-parent": () => {callbacks['unindent-child'](elindex)},
                            "focus-last-dfs-node": focusLastDFSNode,
                            "focus-next-dfs-node": focusNextDFSNode,
                        }} 
                        component={{"$/schema/note_block": DetailedNoteBlock, "$/schema/view": ViewViewDetailed}} attributes={{isChildren: true, isCollapsed: isCol}} allowSubentity
                        style={el.type?.['unigraph.id'] === "$/schema/note_block" ? {} : 
                            { border: "lightgray", borderStyle: "solid", borderWidth: 'thin', margin: "4px", borderRadius: "8px", minWidth: "calc(100% - 8px)" }}
                    />
                </OutlineComponent>
            }) : <OutlineComponent isChildren={isChildren}>
                <PlaceholderNoteBlock callbacks={{"add-child": () => noteBlockCommands['add-child'](dataref.current, editorContext)}}/>
            </OutlineComponent>}
        </div>: []}
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/note_block": NoteBlock})
    registerDetailedDynamicViews({"$/schema/note_block": DetailedNoteBlock})

    registerContextMenuItems("$/schema/note_block", [(uid: any, object: any, handleClose: any, callbacks: any) => <MenuItem onClick={() => {
        handleClose(); callbacks['convert-child-to-todo']();
    }}>
        Convert note as TODO
    </MenuItem>])
}