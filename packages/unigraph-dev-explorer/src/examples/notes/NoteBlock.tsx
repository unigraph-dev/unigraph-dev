import { Typography } from "@material-ui/core";
import React, { FormEvent } from "react";
import { registerDetailedDynamicViews, registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";

import _ from "lodash";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { Actions } from "flexlayout-react";

export const getSubentities = (data: any) => {
    let subentities: any, otherChildren: any;
    if (!(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['])) {
        [subentities, otherChildren] = [[], []];
    } else {
        [subentities, otherChildren] = data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['].sort(byElementIndex).reduce((prev: any, el: any) => {
            if ('$/schema/subentity' !== el?.['_value']?.type?.['unigraph.id']) return [prev[0], [...prev[1], el['_value']]];
            else return [[...prev[0], el['_value']['_value']], prev[1]]
        }, [[], []])
    }
    return [subentities, otherChildren];
}

const getSemanticChildren = (data: any) => data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']

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

type NoteEditorContext = {
    setEdited: (a: boolean) => any;
    setCommand: (a: any) => any;
    childrenref: any
}

const focusUid = (uid: string) => {
    (document.getElementById(`object-view-${uid}`)?.children[0].children[0] as any)?.focus();
}

const noteBlockCommands = {
    "set-focus": (data: any, context: NoteEditorContext, index: number) => {
        console.log(context.childrenref.current.children[index].children[0].children[0].children[0].focus());
    },
    "unsplit-child": async (data: any, context: NoteEditorContext, index: number) => {
        let currSubentity = -1;
        const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
        const delAt = children?.reduce((prev: any[], el: any, elindex: any) => {
            if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity") {
                currSubentity ++;
                if (currSubentity === index) return elindex;
                else return prev;
            } else return prev;
        }, 0)
        if (children[delAt]?.['_value']?.['_value']?.['_value']?.['text']?.['_value.%'] === "") {
            await window.unigraph.deleteItemFromArray(getSemanticChildren(data).uid, children[delAt].uid);
            if (index !== 0) {
                context.setEdited(true);
                context.setCommand(() => noteBlockCommands['set-focus'].bind(this, data, context, index - 1))
            }
        }
    },
    "split-child": (data: any, context: NoteEditorContext, index: number, at: number) => {
        //console.log(JSON.stringify([data, index, at], null, 4))
        let currSubentity = -1;
        let isInserted = false;
        const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
        const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
            if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity") {
                currSubentity ++;
                if (currSubentity === index) {
                    isInserted = true;
                    const newel = {
                        '_index': {'_value.#i': elindex},
                        '_value': {
                            'dgraph.type': ['Entity'],
                            'type': {'unigraph.id': '$/schema/subentity'},
                            '_hide': true,
                            '_value': {
                                'dgraph.type': ['Entity'],
                                '_hide': true,
                                'type': {'unigraph.id': '$/schema/note_block'},
                                '_value': {
                                    'text': {
                                        '_value.%': el['_value']['_value']['_value']['text']['_value.%'].slice(0, at)
                                    }
                                }
                            }
                        }
                    }
                    el['_index']['_value.#i'] = elindex + 1;
                    el['_value']['_hide'] = true; el['_value']['_value']['_hide'] = true;
                    el['_value']['_value']['_value']['text']['_value.%'] = el['_value']['_value']['_value']['text']['_value.%'].slice(at);
                    return [...prev, newel, el];
                } else {
                    if (isInserted) return [...prev, {uid: el.uid, '_index': {'_value.#i': el['_index']['_value.#i'] + 1}}]
                    else return [...prev, {uid: el.uid}]
                }
            } else return [...prev, {uid: el.uid}];
        }, [])
        //console.log(newChildren)
        window.unigraph.updateObject(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.uid, {'children': {'_value[': newChildren}}, false, false);
        context.setEdited(true);
        context.setCommand(() => noteBlockCommands['set-focus'].bind(this, data, context, index + 1))
    },
    /**
     * Indents a child node into their last sibling (or a specified element).
     * 
     * The index is relative to all subentities (outliner children).
     * 
     * TODO: This code is very poorly written. We need to change it after we have unigraph object prototypes.
     */
    "indent-child": (data: any, context: NoteEditorContext, index: number, parent?: number) => {
        if (!parent && index !== 0) {
            parent = index - 1;
        } else if (!parent) {
            return;
        }
        let currSubentity = -1;
        let isDeleted = false;
        let parIndex: number | undefined = undefined;
        let newUid: any = {uid: undefined}
        const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
        const newChildren = children?.map((el: any, elindex: any) => {
            if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity") {
                currSubentity ++;
                if (currSubentity === index) {
                    isDeleted = true;
                    newUid.uid = el['_value'].uid;
                    newUid['_value'] = {uid: el['_value']['_value'].uid}
                    return undefined;
                } else if (currSubentity === parent) {
                    parIndex = elindex;
                    return el;
                } else {
                    if (isDeleted) return {uid: el.uid, '_index': {'_value.#i': el['_index']['_value.#i'] - 1}}
                    else return {uid: el.uid}
                }
            } else return {uid: el.uid};
        })
        if (parIndex !== undefined) newChildren[parIndex] = _.mergeWith({}, newChildren[parIndex], {'_value': { '_value': { '_value': {
            'semantic_properties': {
                '_propertyType': 'inheritance',
                '_value': { 'dgraph.type': 'Entity', type: {'unigraph.id': '$/schema/semantic_properties'}, '_propertyType': 'inheritance', '_value': {
                    children: {'_value[': [{
                        '_index': {'_value.#i': getSemanticChildren(newChildren[parIndex]['_value']['_value'])?.['_value[']?.length || 0}, // always append at bottom
                        '_value': newUid
                    }]}
                }
            }}}}
        }}, function (objValue: any, srcValue: any) {
            if (_.isArray(objValue)) {
              return objValue.concat(srcValue);
            }
          })
        const finalChildren = newChildren.filter((el: any) => el !== undefined);
        console.log(finalChildren)
        window.unigraph.updateObject(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.uid, {'children': {'_value[': finalChildren}}, false, false);
        context.setEdited(true);
        context.setCommand(() => () => focusUid(newUid['_value'].uid));
        //context.setCommand(() => noteBlockCommands['set-focus'].bind(this, data, {...context, childrenref: {current: context.childrenref.current.children[parent as number].children[0].children[0].children[1]}}, -1))
    }
}

export const DetailedNoteBlock = ({data, isChildren, callbacks, options}: any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const [command, setCommand] = React.useState<() => any | undefined>();
    const inputter = (text: string) => {
        return window.unigraph.updateObject(data.uid, {
            text: text
        })
    }
    const dataref = React.useRef<any>();
    const childrenref = React.useRef<any>();
    const inputDebounced = React.useRef(_.throttle(inputter, 1000)).current
    const setCurrentText = (text: string) => {textInput.current.textContent = text};
    const [edited, setEdited] = React.useState(false);
    const textInput: any = React.useRef();
    const editorContext = {
        setEdited, setCommand, childrenref
    }

    React.useEffect(() => {
        dataref.current = data;
        const dataText = data?.['_value']['text']['_value.%']
        if (dataText && options?.viewId) window.layoutModel.doAction(Actions.renameTab(options.viewId, `Note: ${dataText}`))
        //console.log(dataText, edited, textInput.current.textContent)
        if (textInput.current.textContent !== dataText && !edited) {setCurrentText(dataText); textInput.current.textContent = dataText;}
        else if (textInput.current.textContent === dataText && edited) setEdited(false);
    }, [data])

    React.useEffect(() => {
        //console.log(edited, command)
        if (!edited && command) {
            command();
            setCommand(undefined);
        }
    }, [command, edited])

    return <div style={{width: "100%"}}>
        <Typography 
            variant={isChildren ? "body1" : "h4"} 
            contentEditable={true} 
            ref={textInput}
            onInput={(ev) => {onNoteInput(inputDebounced, ev); if (ev.currentTarget.textContent !== data?.['_value']['text']['_value.%'] && !edited) setEdited(true)}}
            onKeyDown={async (ev) => {
                const caret = document.getSelection()?.anchorOffset;
                switch (ev.code) {
                    case 'Enter':
                        ev.preventDefault();
                        inputDebounced.flush();
                        setCommand(() => callbacks['split-child']?.bind(this, caret))
                        break;
                    
                    case 'Tab':
                        ev.preventDefault();
                        inputDebounced.flush();
                        setCommand(() => callbacks['indent-child']?.bind(this));
                        break;

                    case 'Backspace':
                        if (caret === 0 && document.getSelection()?.type === "Caret") {
                            ev.preventDefault();
                            inputDebounced.flush();
                            setCommand(() => callbacks['unsplit-child'].bind(this));
                        }
                        break;
                
                    default:
                        console.log(ev);
                        break;
                }
            }}
        >
        </Typography>
        {buildGraph(otherChildren).map((el: any) => <AutoDynamicView object={el}/>)}
        <ul ref={childrenref}>
            {buildGraph(subentities).map((el: any, elindex) => <li key={el.uid}>
                <AutoDynamicView 
                    object={el} 
                    callbacks={Object.fromEntries(Object.entries(noteBlockCommands).map(([k, v]: any) => [k, (...args: any[]) => v(dataref.current, editorContext, elindex, ...args)]))} 
                    component={{"$/schema/note_block": DetailedNoteBlock}} attributes={{isChildren: true}}
                />
            </li>)}
        </ul>
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/note_block": NoteBlock})
    registerDetailedDynamicViews({"$/schema/note_block": DetailedNoteBlock})
}