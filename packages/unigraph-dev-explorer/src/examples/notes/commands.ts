/* eslint-disable no-plusplus */
import _ from 'lodash';
import { buildUnigraphEntity, byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';
import { dfs, removeAllPropsFromObj } from '../../utils';
import { parseTodoObject } from '../todo/parseTodoObject';
import { NoteEditorContext } from './types';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';

export const focusUid = (uid: string, tail?: boolean) => {
    // console.log("UID " + uid);
    // console.log(document.getElementById(`object-view-${uid}`)?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]);
    // (document.getElementById(`object-view-${uid}`)?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0] as any)?.click();
    window.unigraph.getState('global/focused').setValue({
        uid,
        caret: window.unigraph.getState('global/focused').value?.caret || 0,
        type: '$/schema/note_block',
        tail,
    });
};

export const getSemanticChildren = (data: any) => data?._value?.children;

export const addChild = (data: any, context: NoteEditorContext) => {
    const parents = getParentsAndReferences(data['~_value'], (data['unigraph.origin'] || []))[0].map((el: any) => ({ uid: el.uid }));
    if (!data._hide) parents.push({ uid: data.uid });
    window.unigraph.updateObject(data.uid, {
        children: [{
            type: { 'unigraph.id': '$/schema/subentity' },
            _value: {
                type: { 'unigraph.id': '$/schema/note_block' },
                _value: {
                    text: {
                        type: { 'unigraph.id': '$/schema/markdown' },
                        _value: '',
                    },
                    $context: { // this maps to the note_block object
                        _hide: true,
                    },
                },
                $context: { // this maps to the subentity object
                    _hide: true,
                },
            },
        }],
    }, undefined, undefined, context.callbacks.subsId, parents);
    context.edited.current = true;
    context.setCommand(() => {
        setTimeout(() => {
            focusNextDFSNode(data, context, 0);
        }, 250);
    });
};

export const splitChild = (data: any, context: NoteEditorContext, index: number, oldtext: string, at: number) => {
    // console.log(JSON.stringify([data, index, at], null, 4))
    const parents = getParentsAndReferences(data['~_value'], (data['unigraph.origin'] || []))[0].map((el: any) => ({ uid: el.uid }));
    if (!data._hide) parents.push({ uid: data.uid });
    let currSubentity = -1;
    let isInserted = false;
    let targetUid = '';
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            isInserted = true;
            /* */
            const prevText = oldtext.slice(0, at);
            const splittedEntity = buildUnigraphEntity({
                text: {
                    type: { 'unigraph.id': '$/schema/markdown' },
                    _value: prevText,
                },
            }, '$/schema/note_block', (window.unigraph as any).getSchemaMap());
            (splittedEntity as any)._hide = true;
            // console.log(splittedEntity)
            const newel = {
                _index: { '_value.#i': elindex },
                _value: {
                    'dgraph.type': ['Entity'],
                    type: { 'unigraph.id': '$/schema/subentity' },
                    _hide: true,
                    _value: splittedEntity,
                },
            };
            targetUid = el._value._value.uid;
            // console.log(el)
            el._index['_value.#i'] = elindex + 1;
            el._value._hide = true; el._value._value._hide = true;
            el._value._value._value.text._value._value['_value.%'] = oldtext.slice(at);
            // distribute references accordingly
            if (el?._value?._value?._value?.children?.['_value[']) {
                const oldChildren = el._value._value._value.children;
                const upchildren: any[] = [];
                oldChildren['_value['] = oldChildren['_value['].filter((elc: any) => {
                    if (elc._key && prevText.includes(elc._key)) {
                        upchildren.push({ uid: elc.uid, _index: { '_value.#i': upchildren.length } });
                        return false;
                    } return true;
                }).map((ell: any, idx: number) => ({ uid: ell.uid, _index: { '_value.#i': idx } }));
                // console.log(oldChildren);
                _.merge(newel, { _value: { _value: { _value: { children: { '_value[': upchildren } } } } });
            }
            return [...prev, newel, el];
        }
        if (isInserted) return [...prev, { uid: el.uid, _index: { '_value.#i': el._index['_value.#i'] + 1 } }];
        return [...prev, { uid: el.uid }];
    }, []);
    // console.log(newChildren)
    window.unigraph.updateObject(data?._value?.uid, { children: { '_value[': newChildren } }, false, false, context.callbacks.subsId, parents);
    context.edited.current = true;
    context.setCommand(() => () => focusUid(targetUid));
};

export const unsplitChild = async (data: any, context: NoteEditorContext, index: number) => {
    let currSubentity = -1;
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const delAt = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity') {
            currSubentity++;
            if (currSubentity === index) return elindex;
            return prev;
        } return prev;
    }, 0);
    if (typeof children[delAt]?._value?._value?._value?.text?._value?._value?.['_value.%'] === 'string') {
        window.unigraph.deleteItemFromArray(
            getSemanticChildren(data).uid,
            children[delAt].uid,
            data.uid,
            context.callbacks.subsId,
        );
        setTimeout(() => {
            window.unigraph.deleteObject(([
                children[delAt].uid,
                children[delAt]._value.uid,
                children[delAt]._value._value.uid,
                children[delAt]._value._value._value.uid,
                children[delAt]._value._value._value.text.uid,
                children[delAt]._value._value._value.text._value.uid,
                children[delAt]._value._value._value.text._value._value.uid,
            ] as any), true);
        }, 1000);

        context.edited.current = true;
        focusLastDFSNode({ uid: children[delAt]._value._value.uid }, context, index, true);
    }
};

export const setFocus = (data: any, context: NoteEditorContext, index: number) => {
    context.childrenref.current?.children[index]?.children
        ?.slice?.(-1)[0]?.children[0]?.children[0]?.children[0]?.click();
};

/**
 * Indents a child node into their last sibling (or a specified element).
 *
 * The index is relative to all subentities (outliner children).
 *
 * TODO: This code is very poorly written. We need to change it after we have unigraph object prototypes.
 */
export const indentChild = (data: any, context: NoteEditorContext, index: number, parent?: number) => {
    const parents = getParentsAndReferences(data['~_value'], (data['unigraph.origin'] || []))[0].map((el: any) => ({ uid: el.uid }));
    if (!data._hide) parents.push({ uid: data.uid });
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    if (!parent && index !== 0) {
        parent = index - 1;
    } else if (!parent) {
        return;
    }
    let currSubentity = -1;
    let isDeleted = false;
    let parIndex: number | undefined;
    const newUid: any = { uid: undefined };
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.map((el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity') {
            currSubentity++;
            if (currSubentity === index) {
                isDeleted = true;
                newUid.uid = el._value.uid;
                newUid._value = { uid: el._value._value.uid };
                return undefined;
            } if (currSubentity === parent) {
                parIndex = elindex;
                return el;
            }
            if (isDeleted) return { uid: el.uid, _index: { '_value.#i': el._index['_value.#i'] - 1 } };
            return { uid: el.uid };
        }
        if (isDeleted) return { uid: el.uid, _index: { '_value.#i': el._index['_value.#i'] - 1 } };
        return { uid: el.uid };
    });
    if (parIndex !== undefined) {
        newChildren[parIndex] = {
            uid: newChildren[parIndex].uid,
            _value: {
                uid: newChildren[parIndex]._value.uid,
                _value: {
                    uid: newChildren[parIndex]._value._value.uid,
                    _value: {
                        uid: newChildren[parIndex]._value._value._value.uid,
                        children: {
                            uid: newChildren[parIndex]._value._value._value.children?.uid || undefined,
                            '_value[': [{
                                _index: { '_value.#i': getSemanticChildren(newChildren[parIndex]._value)?.['_value[']?.length || 0 }, // always append at bottom
                                _value: newUid,
                            }],
                        },
                    },
                },
            },
        };
    }
    const finalChildren = newChildren.filter((el: any) => el !== undefined);
    // console.log(finalChildren)
    window.unigraph.updateObject(data?._value?.uid, { children: { '_value[': finalChildren } }, false, false, context.callbacks.subsId, parents);
    context.edited.current = true;

    context.setCommand(() => () => focusUid(newUid._value.uid));
    // context.setCommand(() => noteBlockCommands['set-focus'].bind(this, data, {...context, childrenref: {current: context.childrenref.current.children[parent as number].children[0].children[0].children[1]}}, -1))
};

export const unindentChild = async (data: any, context: NoteEditorContext, parent: number, index: number) => {
    const parents = getParentsAndReferences(data['~_value'], (data['unigraph.origin'] || []))[0].map((el: any) => ({ uid: el.uid }));
    if (!data._hide) parents.push({ uid: data.uid });
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    // console.log(parent, index)
    let currSubentity = -1;
    const isCompleted = false;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    let delUidPar = '';
    let delUidChild = '';
    const newChildren = children.reduce((prev: any[], curr: any) => {
        if (curr?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === parent) {
            let currChildSubentity = -1;
            const childIsCompleted = false;
            let targetChild: any = null;
            const childChildren = getSemanticChildren(curr._value._value)?.['_value['].sort(byElementIndex);
            const newChildChildren = childChildren.reduce((cprev: any[], ccurr: any) => {
                if (ccurr?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currChildSubentity === index) {
                    targetChild = ccurr;
                    delUidChild = ccurr.uid;
                    return cprev;
                }
                if (childIsCompleted) return [...cprev, { uid: ccurr.uid, _index: { '_value.#i': ccurr._index['_value.#i'] + 1 } }];
                return [...cprev, { uid: ccurr.uid }];
            }, []);
            targetChild._index = { '_value.#i': curr._index['_value.#i'] + 1 };
            const newParent = {
                uid: curr.uid,
                _value: {
                    uid: curr._value.uid,
                    _value: {
                        uid: curr._value._value.uid,
                        _value: {
                            uid: curr._value._value._value.uid,
                            children: {
                                '_value[': newChildChildren,
                            },
                        },
                    },
                },
            };
            delUidPar = curr._value._value._value.children.uid;
            return [...prev, newParent, targetChild];
        }
        if (isCompleted) return [...prev, { uid: curr.uid, _index: { '_value.#i': curr._index['_value.#i'] + 1 } }];
        return [...prev, { uid: curr.uid }];
    }, []);
    // console.log(newChildren, newChildren[parent+1]['_value']['_value'].uid);
    await window.unigraph.updateObject(data?._value?.uid, { ...data._value, children: { '_value[': newChildren } }, false, false, [], parents);
    await window.unigraph.deleteItemFromArray(delUidPar, delUidChild);
    context.edited.current = true;
    context.setCommand(() => () => focusUid(newChildren[parent + 1]._value._value.uid));
};

export const focusLastDFSNode = (data: any, context: NoteEditorContext, index: number, tail?: boolean) => {
    focusUid(getLastDFSNode(data, context, index), tail);
};

export const focusNextDFSNode = (data: any, context: NoteEditorContext, index: number, tail?: boolean) => {
    console.log(getNextDFSNode(data, context, index));
    focusUid(getNextDFSNode(data, context, index), tail);
};

export const getLastDFSNode = (data: any, context: NoteEditorContext, index: number) => {
    const orderedNodes = dfs(context.nodesState.value);
    const newIndex = orderedNodes.findIndex((el) => el.uid === data.uid) - 1;
    if (orderedNodes[newIndex] && !orderedNodes[newIndex].root) return orderedNodes[newIndex].uid;
    return '';
};

export const getNextDFSNode = (data: any, context: NoteEditorContext, index: number) => {
    const orderedNodes = dfs(context.nodesState.value);
    console.log(orderedNodes);
    const newIndex = orderedNodes.findIndex((el) => el.uid === data.uid) + 1;
    if (orderedNodes[newIndex] && !orderedNodes[newIndex].root) return orderedNodes[newIndex].uid;
    return '';
};

export const convertChildToTodo = async (data: any, context: NoteEditorContext, index: number) => {
    const parents = getParentsAndReferences(data['~_value'], (data['unigraph.origin'] || []))[0].map((el: any) => ({ uid: el.uid }));
    if (!data._hide) parents.push({ uid: data.uid });
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    // console.log(index);
    let currSubentity = -1;
    const stubConverted = { uid: '' };
    let textIt = '';
    let refs: any[] = [];
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            /* something something */
            const newel = {
                _index: { '_value.#i': elindex },
                _value: {
                    'dgraph.type': ['Entity'],
                    type: { 'unigraph.id': '$/schema/subentity' },
                    _hide: true,
                    _value: stubConverted,
                },
            };
            textIt = el._value._value._value.text._value._value['_value.%'];
            refs = el._value._value._value?.children?.['_value[']?.filter?.((it: any) => it._key).map((ell: any) => ({ key: ell._key.slice(2, -2), value: ell._value._value.uid })) || [];
            return [...prev, newel];
        }
        return [...prev, { uid: el.uid }];
    }, []);
    // console.log(textIt, newChildren, )
    const newUid = await window.unigraph.addObject(parseTodoObject(textIt, refs), '$/schema/todo');
    // eslint-disable-next-line prefer-destructuring
    stubConverted.uid = newUid[0];
    await window.unigraph.updateObject(data?._value?.uid, { ...data._value, children: { '_value[': newChildren } }, false, false, context.callbacks.subsId, parents);
};

export const replaceChildWithUid = async (data: any, context: NoteEditorContext, index: number, uid: string) => {
    // console.log(index);
    let currSubentity = -1;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            /* something something */
            const newel = {
                uid: el.uid,
                _value: {
                    // subentity
                    uid: el._value.uid,
                    _value: { uid },
                },
            };
            return [...prev, newel];
        }
        return [...prev, { uid: el.uid }];
    }, []);
    await window.unigraph.updateObject(data?._value?.uid, { ...data._value, children: { '_value[': newChildren } }, false, false, context.callbacks.subsId);
};
