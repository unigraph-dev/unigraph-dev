import _ from "lodash";
import { buildUnigraphEntity, byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";
import { dfs } from "../../utils";
import { parseTodoObject } from "../todo/parseTodoObject";
import { NoteEditorContext } from "./types";

export const focusUid = (uid: string) => {
    console.log("UID " + uid);
    console.log(document.getElementById(`object-view-${uid}`)?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]);
    (document.getElementById(`object-view-${uid}`)?.children[0]?.children[0]?.children[0]?.children[0]?.children[0] as any)?.click();
}

export const setCaret = (document: Document, element: any, pos: number, length?: number) => {
    let range = document.createRange()
    let sel = document.getSelection()
    range.setStart(element, pos)
    if (length) {range.setEnd(element, length+pos)} else {range.collapse(true)};
    
    sel?.removeAllRanges()
    sel?.addRange(range)
}

export const getSemanticChildren = (data: any) => data?.['_value']?.['children']

export const addChild = (data: any, context: NoteEditorContext) => {
    window.unigraph.updateObject(data.uid, {
        "children": [{
            "type": {"unigraph.id": "$/schema/subentity"},
            "_value": {
                "type": {"unigraph.id": "$/schema/note_block"},
                "_value": {
                    "text": {
                        "type": {"unigraph.id": "$/schema/markdown"},
                        "_value": ""
                    },
                    "$context": { //this maps to the note_block object
                        "_hide": true
                    }
                },
                "$context": { // this maps to the subentity object
                    "_hide": true
                },
            }
        }]
    }, undefined, undefined, context.callbacks.subsId);
    context.edited.current = true;
    context.setCommand(() => setFocus.bind(this, data, context, 0));
}

export const splitChild = (data: any, context: NoteEditorContext, index: number, oldtext: string, at: number) => {
    //console.log(JSON.stringify([data, index, at], null, 4))
    let currSubentity = -1;
    let isInserted = false;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currSubentity === index) {
            isInserted = true;
            /* */
            const prevText = oldtext.slice(0, at);
            const splittedEntity = buildUnigraphEntity({
                text: {
                    type: {"unigraph.id": "$/schema/markdown"}, 
                    _value: prevText
                }
            }, "$/schema/note_block", (window.unigraph as any).getSchemaMap());
            (splittedEntity as any)['_hide'] = true;
            //console.log(splittedEntity)
            let newel = {
                '_index': {'_value.#i': elindex},
                '_value': {
                    'dgraph.type': ['Entity'],
                    'type': {'unigraph.id': '$/schema/subentity'},
                    '_hide': true,
                    '_value': splittedEntity
                }
            }
            //console.log(el)
            el['_index']['_value.#i'] = elindex + 1;
            el['_value']['_hide'] = true; el['_value']['_value']['_hide'] = true;
            el['_value']['_value']['_value']['text']['_value']['_value']['_value.%'] = oldtext.slice(at);
            // distribute references accordingly
            if (el?.['_value']?.['_value']?.['_value']?.['children']?.['_value[']) {
                const oldChildren = el['_value']['_value']['_value']['children'];
                let upchildren: any[] = [];
                oldChildren['_value['] = oldChildren['_value['].filter((elc: any) => {
                    if (elc['_key'] && prevText.includes(elc['_key'])) {
                        upchildren.push({...elc, "_index": {"_value.#i": upchildren.length}});
                        return false;
                    } else return true;
                }).map((ell: any, idx: number) => {return {...ell, "_index": {"_value.#i": idx}}})
                //console.log(oldChildren);
                _.merge(newel, {'_value': {'_value': {'_value': {'children': {'_value[': upchildren}}}}})
            }
            return [...prev, newel, el];
        } else {
            if (isInserted) return [...prev, {uid: el.uid, '_index': {'_value.#i': el['_index']['_value.#i'] + 1}}]
            else return [...prev, {uid: el.uid}]
        };
    }, [])
    console.log(newChildren)
    window.unigraph.updateObject(data?.['_value']?.uid, {children: {'_value[': newChildren}}, false, false, context.callbacks.subsId);
    context.edited.current = true;
    context.setCommand(() => setFocus.bind(this, data, context, index + 1))
}

export const unsplitChild = async (data: any, context: NoteEditorContext, index: number) => {
    let currSubentity = -1;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const delAt = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity") {
            currSubentity ++;
            if (currSubentity === index) return elindex;
            else return prev;
        } else return prev;
    }, 0)
    if (/*children[delAt]?.['_value']?.['_value']?.['_value']?.['text']?.['_value']?.['_value']?.['_value.%'] === ""*/ true ) {
        window.unigraph.deleteItemFromArray(getSemanticChildren(data).uid, children[delAt].uid, data.uid, context.callbacks.subsId);
        if (index !== 0) {
            context.edited.current = true;
            focusLastDFSNode({uid: children[delAt]['_value']['_value'].uid}, context, index)
        }
    }
}

export const setFocus = (data: any, context: NoteEditorContext, index: number) => {
    console.log(data, index, context.childrenref.current?.children)
    console.log(context.childrenref.current?.children[index]?.children?.slice?.(-1)[0]?.children[0]?.children[0]?.click());
}

/**
 * Indents a child node into their last sibling (or a specified element).
 * 
 * The index is relative to all subentities (outliner children).
 * 
 * TODO: This code is very poorly written. We need to change it after we have unigraph object prototypes.
 */
export const indentChild = (data: any, context: NoteEditorContext, index: number, parent?: number) => {
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
        } else {
            if (isDeleted) return {uid: el.uid, '_index': {'_value.#i': el['_index']['_value.#i'] - 1}}
            else return {uid: el.uid}
        };
    })
    if (parIndex !== undefined) newChildren[parIndex] = {
            uid: newChildren[parIndex].uid,
            '_value': { 
                uid: newChildren[parIndex]._value.uid,
                '_value': { 
                    uid: newChildren[parIndex]._value._value.uid,
                    '_value': {
                        uid: newChildren[parIndex]._value._value._value.uid,
                        children: {
                            uid: newChildren[parIndex]._value._value._value.children?.uid || undefined,
                            '_value[': [{
                            '_index': {'_value.#i': getSemanticChildren(newChildren[parIndex]['_value'])?.['_value[']?.length || 0}, // always append at bottom
                            '_value': newUid
                        }]}
            }
        }}
    };
    const finalChildren = newChildren.filter((el: any) => el !== undefined);
    console.log(finalChildren)
    window.unigraph.updateObject(data?.['_value']?.uid, {children: {'_value[': finalChildren}}, false, false, context.callbacks.subsId);
    context.edited.current = true;
    
    context.setCommand(() => 
        setTimeout(() => {
            focusUid(newUid['_value'].uid)
        }, 250)
    );
    //context.setCommand(() => noteBlockCommands['set-focus'].bind(this, data, {...context, childrenref: {current: context.childrenref.current.children[parent as number].children[0].children[0].children[1]}}, -1))
}

export const unindentChild = async (data: any, context: NoteEditorContext, parent: number, index: number) => {
    //console.log(parent, index)
    let currSubentity = -1;
    let isCompleted = false;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    let delUidPar = "", delUidChild = "";
    const newChildren = children.reduce((prev: any[], curr: any) => {
        if (curr?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currSubentity === parent) {
            let currChildSubentity = -1;
            let childIsCompleted = false;
            let targetChild: any = null;
            const childChildren = getSemanticChildren(curr['_value']['_value'])?.['_value['].sort(byElementIndex);
            const newChildChildren = childChildren.reduce((cprev: any[], ccurr: any) => {
                if (ccurr?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currChildSubentity === index) {
                    targetChild = ccurr;
                    delUidChild = ccurr.uid;
                    return cprev;
                } else {
                    if (childIsCompleted) return [...cprev, {uid: ccurr.uid, '_index': {'_value.#i': ccurr['_index']['_value.#i'] + 1}}]
                    else return [...cprev, {uid: ccurr.uid}]
                }
            }, [])
            targetChild['_index'] = {'_value.#i': curr['_index']['_value.#i'] + 1};
            const newParent = {
                uid: curr.uid,
                _value: {uid: curr['_value'].uid, _value: {
                    uid: curr['_value']['_value'].uid, _value: {
                        uid: curr['_value']['_value']['_value'].uid,
                        children: {
                            '_value[': newChildChildren
                        }
                    }
                }}
            }
            delUidPar = curr['_value']['_value']['_value']['children'].uid;
            return [...prev, newParent, targetChild]
        } else {
            if (isCompleted) return [...prev, {uid: curr.uid, '_index': {'_value.#i': curr['_index']['_value.#i'] + 1}}]
            else return [...prev, {uid: curr.uid}]
        };
    }, [])
    console.log(newChildren, newChildren[parent+1]['_value']['_value'].uid);
    await window.unigraph.updateObject(data?.['_value']?.uid, {...data['_value'], children: {'_value[': newChildren}}, false, false, []);
    await window.unigraph.deleteItemFromArray(delUidPar, delUidChild)
    context.edited.current = true;
    context.setCommand(() => setTimeout(() => {
        focusUid(newChildren[parent+1]['_value']['_value'].uid)
    }, 250))
}

export const focusLastDFSNode = (data: any, context: NoteEditorContext, _: number) => {
    const orderedNodes = dfs(context.nodesState.value);
    const newIndex = orderedNodes.findIndex(el => el.uid === data.uid) - 1;
    if (orderedNodes[newIndex] && !orderedNodes[newIndex].root) focusUid(orderedNodes[newIndex].uid)
}

export const focusNextDFSNode = (data: any, context: NoteEditorContext, _: number) => {
    const orderedNodes = dfs(context.nodesState.value);
    const newIndex = orderedNodes.findIndex(el => el.uid === data.uid) + 1;
    if (orderedNodes[newIndex] && !orderedNodes[newIndex].root) focusUid(orderedNodes[newIndex].uid)
}

export const convertChildToTodo = async (data: any, context: NoteEditorContext, index: number) => {
    //console.log(index);
    let currSubentity = -1;
    const stubConverted = {uid: ""}
    let textIt = "";
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currSubentity === index) {
            /* something something*/
            const newel = {
                '_index': {'_value.#i': elindex},
                '_value': {
                    'dgraph.type': ['Entity'],
                    'type': {'unigraph.id': '$/schema/subentity'},
                    '_hide': true,
                    '_value': stubConverted,
                }
            }
            textIt = el['_value']['_value']['_value']['text']['_value']['_value']['_value.%'];
            return [...prev, newel];
        } else {
            return [...prev, {uid: el.uid}]
        };
    }, []);
    //console.log(textIt, newChildren, )
    const newUid = await window.unigraph.addObject(parseTodoObject(textIt), "$/schema/todo")
    stubConverted.uid = newUid[0];
    await window.unigraph.updateObject(data?.['_value']?.uid, {...data['_value'], children: {'_value[': newChildren}}, false, false, context.callbacks.subsId);
}

export const replaceChildWithUid = async (data: any, context: NoteEditorContext, index: number, uid: string) => {
    //console.log(index);
    let currSubentity = -1;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currSubentity === index) {
            /* something something*/
            const newel = {
                'uid': el.uid,
                '_value': {
                    // subentity
                    uid: el._value.uid,
                    '_value': {uid: uid},
                }
            };
            return [...prev, newel];
        } else {
            return [...prev, {uid: el.uid}]
        };
    }, []);
    await window.unigraph.updateObject(data?.['_value']?.uid, {...data['_value'], children: {'_value[': newChildren}}, false, false, context.callbacks.subsId);
}