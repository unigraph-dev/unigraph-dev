import _ from "lodash";
import { buildUnigraphEntity, byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";
import { NoteEditorContext } from "./types";

export const focusUid = (uid: string) => {
    (document.getElementById(`object-view-${uid}`)?.children[0].children[0] as any)?.focus();
}

export const getSemanticChildren = (data: any) => data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']

export const addChild = (data: any, context: NoteEditorContext) => {
    window.unigraph.updateObject(data.uid, {
        semantic_properties: {
            children: [{
                type: {"unigraph.id": "$/schema/subentity"},
                _value: {
                    type: {"unigraph.id": "$/schema/note_block"},
                    text: {
                        type: {"unigraph.id": "$/schema/markdown"},
                        _value: ""
                    }
                }
            }]
        }
    }, undefined, undefined, context.callbacks.subsId);
    context.setEdited(true);
    context.setCommand(() => setFocus.bind(this, data, context, 0));
}

export const splitChild = (data: any, context: NoteEditorContext, index: number, at: number) => {
    //console.log(JSON.stringify([data, index, at], null, 4))
    let currSubentity = -1;
    let isInserted = false;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?.['_value']?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currSubentity === index) {
            isInserted = true;
            /* */
            const splittedEntity = buildUnigraphEntity({
                text: {
                    type: {"unigraph.id": "$/schema/markdown"}, 
                    _value: el['_value']['_value']['_value']['_value']['text']?.['_value']?.['_value']['_value.%'].slice(0, at)
                }
            }, "$/schema/note_block", (window.unigraph as any).getSchemaMap());
            (splittedEntity as any)['_hide'] = true;
            console.log(splittedEntity)
            const newel = {
                '_index': {'_value.#i': elindex},
                '_value': {
                    'dgraph.type': ['Interface'],
                    'type': {'unigraph.id': '$/schema/interface/semantic'},
                    '_hide': true,
                    '_value': {
                        'dgraph.type': ['Entity'],
                        'type': {'unigraph.id': '$/schema/subentity'},
                        '_hide': true,
                        '_value': splittedEntity
                    }
                }
            }
            console.log(el)
            el['_index']['_value.#i'] = elindex + 1;
            el['_value']['_hide'] = true; el['_value']['_value']['_hide'] = true; el['_value']['_value']['_value']['_hide'] = true;
            el['_value']['_value']['_value']['_value']['text']['_value']['_value']['_value.%'] = el['_value']['_value']['_value']['_value']['text']?.['_value']?.['_value']['_value.%'].slice(at);
            return [...prev, newel, el];
        } else {
            if (isInserted) return [...prev, {uid: el.uid, '_index': {'_value.#i': el['_index']['_value.#i'] + 1}}]
            else return [...prev, {uid: el.uid}]
        };
    }, [])
    //console.log(newChildren)
    window.unigraph.updateObject(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.uid, {'children': {'_value[': newChildren}}, false, false, context.callbacks.subsId);
    context.setEdited(true);
    context.setCommand(() => setFocus.bind(this, data, context, index + 1))
}

export const unsplitChild = async (data: any, context: NoteEditorContext, index: number) => {
    let currSubentity = -1;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const delAt = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?.['_value']?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity") {
            currSubentity ++;
            if (currSubentity === index) return elindex;
            else return prev;
        } else return prev;
    }, 0)
    if (children[delAt]?.['_value']?.['_value']?.['_value']?.['_value']?.['text']?.['_value']?.['_value']?.['_value.%'] === "") {
        await window.unigraph.deleteItemFromArray(getSemanticChildren(data).uid, children[delAt].uid, data.uid, context.callbacks.subsId);
        if (index !== 0) {
            context.setEdited(true);
            context.setCommand(() => setFocus.bind(this, data, context, index - 1))
        }
    }
}

export const setFocus = (data: any, context: NoteEditorContext, index: number) => {
    console.log(context.childrenref.current?.children[index]?.children[0]?.children[0]?.children[0]?.click());
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
        if (el?.['_value']?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity") {
            currSubentity ++;
            if (currSubentity === index) {
                isDeleted = true;
                newUid.uid = el['_value'].uid;
                newUid['_value'] = {uid: el['_value']['_value'].uid, '_value': {uid: el['_value']['_value']['_value'].uid}}
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
    if (parIndex !== undefined) newChildren[parIndex] = _.mergeWith({}, newChildren[parIndex], {'_value': {'_value': { '_value': { '_value': {
        'semantic_properties': {
            '_propertyType': 'inheritance',
            '_value': { 'dgraph.type': 'Entity', type: {'unigraph.id': '$/schema/semantic_properties'}, '_propertyType': 'inheritance', '_value': {
                children: {'_value[': [{
                    '_index': {'_value.#i': getSemanticChildren(newChildren[parIndex]['_value']['_value'])?.['_value[']?.length || 0}, // always append at bottom
                    '_value': newUid
                }]}
            }
        }}}}}
    }}, function (objValue: any, srcValue: any) {
        if (_.isArray(objValue)) {
          return objValue.concat(srcValue);
        }
      })
    const finalChildren = newChildren.filter((el: any) => el !== undefined);
    console.log(finalChildren)
    window.unigraph.updateObject(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.uid, {'children': {'_value[': finalChildren}}, false, false, context.callbacks.subsId);
    context.setEdited(true);
    
    context.setCommand(() => () => {focusUid(newUid['_value']['_value'].uid)});
    //context.setCommand(() => noteBlockCommands['set-focus'].bind(this, data, {...context, childrenref: {current: context.childrenref.current.children[parent as number].children[0].children[0].children[1]}}, -1))
}

export const unindentChild = async (data: any, context: NoteEditorContext, parent: number, index: number) => {
    console.log(parent, index)
    let currSubentity = -1;
    let isCompleted = false;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    let delUidPar = "", delUidChild = "";
    const newChildren = children.reduce((prev: any[], curr: any) => {
        if (curr?.['_value']?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currSubentity === parent) {
            let currChildSubentity = -1;
            let childIsCompleted = false;
            let targetChild: any = null;
            const childChildren = getSemanticChildren(curr['_value']['_value']['_value'])?.['_value['].sort(byElementIndex);
            const newChildChildren = childChildren.reduce((cprev: any[], ccurr: any) => {
                if (ccurr?.['_value']?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity" && ++currChildSubentity === index) {
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
                        uid: curr['_value']['_value']['_value'].uid, _value: {
                            uid: curr['_value']['_value']['_value']['_value'].uid, semantic_properties: {
                                uid: curr['_value']['_value']['_value']['_value']['semantic_properties'].uid, _value: {
                                    uid: curr['_value']['_value']['_value']['_value']['semantic_properties']['_value'].uid, _value: {
                                        uid: curr['_value']['_value']['_value']['_value']['semantic_properties']['_value']['_value'].uid,
                                        children: {
                                            //uid: curr['_value']['_value']['_value']['_value']['semantic_properties']['_value']['_value']['children'].uid, 
                                            '_value[': newChildChildren
                                        }
                                    }
                                }
                            }
                        }
                    }
                }}
            }
            delUidPar = curr['_value']['_value']['_value']['_value']['semantic_properties']['_value']['_value']['children'].uid;
            return [...prev, newParent, targetChild]
        } else {
            if (isCompleted) return [...prev, {uid: curr.uid, '_index': {'_value.#i': curr['_index']['_value.#i'] + 1}}]
            else return [...prev, {uid: curr.uid}]
        };
    }, [])
    console.log(newChildren);
    await window.unigraph.updateObject(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.uid, {'children': {'_value[': newChildren}}, false, false, context.callbacks.subsId);
    window.unigraph.deleteItemFromArray(delUidPar, delUidChild)
    context.setEdited(true);
    context.setCommand(() => setFocus.bind(this, data, context, parent + 1))
}