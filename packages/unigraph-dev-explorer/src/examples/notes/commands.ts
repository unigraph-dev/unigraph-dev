/* eslint-disable no-plusplus */
import _ from 'lodash';
import { buildUnigraphEntity, byElementIndex, clearEmpties } from 'unigraph-dev-common/lib/utils/entityUtils';
import { dfs, removeAllPropsFromObj } from '../../utils';
import { parseTodoObject } from '../todo/parseTodoObject';
import { NoteEditorContext } from './types';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';
import { addCommand, CommandState, getChildrenStubMap, getCurrentFocus } from './history';

export const focusUid = (obj: any, goingUp?: boolean, caret?: number) => {
    // console.log(document.getElementById(`object-view-${uid}`)?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]);
    // (document.getElementById(`object-view-${uid}`)?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0] as any)?.click();
    const focusState = window.unigraph.getState('global/focused').value;
    const newFocused = {
        uid: obj?.startsWith?.('0x') ? obj : obj.uid,
        caret: caret !== undefined ? caret : focusState?.caret || 0, // if -1, means carret at the end of next block
        type: obj?.type || '$/schema/note_block',
        tail: goingUp || (goingUp === undefined && focusState?.tail ? focusState.tail : undefined),
        component: obj?.componentId || '',
    };
    window.unigraph.getState('global/focused').setValue(newFocused);
};

const getParents = (data: any) =>
    getParentsAndReferences(data['~_value'], data['unigraph.origin'] || [])[0].map((el: any) => ({
        uid: el.uid,
    }));

export const getSemanticChildren = (data: any) => data?._value?.children;
export const getSubentities = (data: any) =>
    (getSemanticChildren(data)?.['_value['] || []).filter(
        (el: any) => el?._value?.type?.['unigraph.id'] === '$/schema/subentity',
    );

export const addChild = (
    data: any,
    context: NoteEditorContext,
    index?: number,
    changeValue: false | string = false,
) => {
    if (typeof index === 'undefined') index = (getSemanticChildren(data)?.['_value[']?.length || 0) - 1;
    return addChildren(data, context, index, [''], changeValue);
};

export const addChildren = (
    data: any,
    context: NoteEditorContext,
    index: number,
    children: string[],
    changeValue?: false | string,
) => {
    let uidMode = false;
    if (children.filter((el) => el.startsWith('0x')).length === children.length) uidMode = true;
    const prevUid =
        getSubentities(data).sort(byElementIndex)[index || (getSemanticChildren(data)?.['_value[']?.length || 0) - 1]
            ?._value?._value?.uid;
    if (typeof index === 'undefined') index = (getSemanticChildren(data)?.['_value[']?.length || 0) - 1;
    else index = getSubentities(data).sort(byElementIndex)[index]?._index?.['_value.#i'] || 0;
    const parents = getParents(data);
    if (!data._hide) parents.push({ uid: data.uid });
    const myUid = (window.unigraph as any).leaseUid();
    console.log('addChildren', {
        data,
        "data?._value?.children?.['_value[']": data?._value?.children?.['_value['],
        index,
    });
    addCommand(context.historyState.value, [
        {
            type: 'children',
            uid: data._value.uid,
            subsId: context.callbacks.subsId,
            oldChildrenUid: data._value.children?.uid,
            // oldData: newChildren[parIndex]._value._value._value,
            oldData: getChildrenStubMap(data._value?.children),
            focusUid: prevUid,
            focusCaret: -1,
        },
    ]);
    window.unigraph.updateObject(
        data._value.uid,
        {
            children: {
                _displayAs: data?._value?.children?._displayAs,
                '_value[': [
                    ...(data?._value?.children?.['_value['] || []).map((el: any) => ({
                        _value: { uid: el._value.uid },
                        _key: el._key,
                        _index: {
                            '_value.#i':
                                el._index['_value.#i'] > (index as number)
                                    ? el._index['_value.#i'] + children.length
                                    : el._index['_value.#i'],
                        },
                        ...(changeValue && el._index?.['_value.#i'] === index
                            ? {
                                  _value: {
                                      uid: el._value.uid,
                                      _value: {
                                          uid: el._value._value.uid,
                                          _value: {
                                              uid: el._value._value._value.uid,
                                              text: {
                                                  uid: el?._value?._value?._value?.text?.uid,
                                                  _value: {
                                                      uid: el?._value?._value?._value?.text?._value?.uid,
                                                      _value: {
                                                          uid: el?._value?._value?._value?.text?._value?._value?.uid,
                                                          '_value.%': changeValue,
                                                      },
                                                  },
                                              },
                                          },
                                      },
                                  },
                              }
                            : {}),
                    })),
                    ...children.map((el: string, i: number) => ({
                        _value: {
                            type: {
                                'unigraph.id': '$/schema/subentity',
                            },
                            'dgraph.type': 'Entity',
                            _value: uidMode
                                ? { uid: el }
                                : {
                                      ...(buildUnigraphEntity as any)(
                                          {
                                              text: {
                                                  type: { 'unigraph.id': '$/schema/markdown' },
                                                  _value: el,
                                              },
                                          },
                                          '$/schema/note_block',
                                          (window.unigraph as any).getSchemaMap(),
                                          undefined,
                                          { globalStates: { nextUid: 100000 * i } },
                                      ),
                                      _hide: true,
                                      uid: i === children.length - 1 ? myUid : undefined,
                                  },
                            _updatedAt: new Date().toISOString(),
                            _createdAt: new Date().toISOString(),
                            _hide: true,
                            'unigraph.indexes': {},
                        },
                        _index: {
                            '_value.#i': index + i + 1,
                        },
                    })),
                ],
            },
        },
        false,
        false,
        context.callbacks.subsId,
        parents,
        !uidMode,
    );
    focusUid(myUid, true, -1);
};

export const splitChild = (data: any, context: NoteEditorContext, index: number, oldtext: string, at: number) => {
    // console.log(JSON.stringify([data, index, at], null, 4))
    console.log(getSubentities(data).sort(byElementIndex)[index]?._value?._value);
    if (
        oldtext.slice(at) === '' &&
        !getSubentities(getSubentities(data).sort(byElementIndex)[index]?._value?._value).length
    ) {
        addChild(data, context, index, oldtext);
        return;
    }
    const parents = getParents(data);
    if (!data._hide) parents.push({ uid: data.uid });
    let currSubentity = -1;
    let isInserted = false;
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    let toDelete: any = [];
    const undoCommand: CommandState = [];
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            isInserted = true;
            /* */
            const prevText = oldtext.slice(0, at);
            const splittedEntity = buildUnigraphEntity(
                {
                    text: {
                        type: { 'unigraph.id': '$/schema/markdown' },
                        _value: prevText,
                    },
                },
                '$/schema/note_block',
                (window.unigraph as any).getSchemaMap(),
            );
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
            // console.log(el)
            el.uid = undefined;
            el._index.uid = undefined;
            el._index['_value.#i'] = elindex + 1;
            el._value._hide = true;
            el._value._value._hide = true;
            const loc = el._value._value._value.text || el._value._value._value.name;
            loc._value._value['_value.%'] = oldtext.slice(at);
            undoCommand.push({
                type: 'textual',
                subsId: context.callbacks.subsId,
                uid: loc._value._value.uid,
                oldText: oldtext,
                ...getCurrentFocus(),
            });
            // distribute references accordingly
            if (el?._value?._value?._value?.children?.['_value[']) {
                const oldChildren = el._value._value._value.children;
                const upchildren: any[] = [];
                oldChildren['_value['] = oldChildren['_value[']
                    .filter((elc: any) => {
                        if (elc._key && prevText.includes(elc._key)) {
                            upchildren.push({
                                uid: elc.uid,
                                _index: { '_value.#i': upchildren.length },
                            });
                            return false;
                        }
                        return true;
                    })
                    .map((ell: any, idx: number) => ({
                        uid: ell.uid,
                        _index: { '_value.#i': idx },
                    }));
                if (upchildren.length) {
                    // re-create references in old block
                    toDelete = [oldChildren.uid, upchildren.map((ell: any) => ell.uid), el._value._value.uid];
                }
                // console.log(oldChildren);
                _.merge(newel, {
                    _value: {
                        _value: {
                            _value: { children: { '_value[': upchildren } },
                        },
                    },
                });
            }
            return [...prev, newel, el];
        }
        if (isInserted)
            return [
                ...prev,
                {
                    _value: { uid: el._value.uid },
                    _key: el._key,
                    _index: { '_value.#i': el._index['_value.#i'] + 1 },
                },
            ];
        return [
            ...prev,
            {
                _value: { uid: el._value.uid },
                _key: el._key,
                _index: { uid: el._index.uid },
            },
        ];
    }, []);
    undoCommand.push({
        type: 'children',
        subsId: context.callbacks.subsId,
        uid: data._value.uid,
        oldChildrenUid: data._value?.children?.uid,
        oldData: getChildrenStubMap(data._value?.children),
    });
    addCommand(context.historyState.value, undoCommand);
    window.unigraph.updateObject(
        data?._value?.uid,
        { children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren } },
        false,
        false,
        context.callbacks.subsId,
        parents,
        true,
    );
    window.unigraph.touch(parents.map((el) => el.uid));
    if (toDelete.length)
        window.unigraph.deleteItemFromArray(toDelete[0], toDelete[1], toDelete[2], context.callbacks.subsId);
};

const getAllChildren = (data: any, childrenUids: string[]) => {
    const children = (data?.['_value['] || []).sort(byElementIndex);
    if (children.length > 0) {
        return children
            .map((el: any) => {
                if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' || el?._key)
                    childrenUids.push(
                        el?._value?.uid,
                        el?._value?._value?.uid,
                        el?._value?._value?._value?.content?._value?.uid,
                    );
                return {
                    content: el?._value?._value?._value?.text?._value?._value?.['_value.%'],
                    children: el?._key ? [] : getAllChildren(el?._value?._value?._value?.children, childrenUids),
                    type: el?._value?.type?.['unigraph.id'],
                };
            })
            .filter((el: any) => el.type === '$/schema/subentity');
    }
    return [];
};

export const copyChildToClipboard = (data: any, context: NoteEditorContext, index: number, cut = false) => {
    let currSubentity = -1;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    let cutItem;
    children?.forEach((el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            const childrenUids: string[] = [
                el?._value?.uid,
                el?._value?._value?.uid,
                el?._value?._value?._value?.content?._value?.uid,
            ];
            cutItem = {
                uid: el?._value?._value?.uid,
                childrenUids,
                content: el?._value?._value?._value?.text?._value?._value?.['_value.%'],
                index: currSubentity,
                children: getAllChildren(el?._value?._value?._value?.children, childrenUids).filter(Boolean),
            };
        }
    });
    if (cut) deleteChild(data, context, index, false);
    return cutItem;
};

export const deleteChild = (data: any, context: NoteEditorContext, index: number, permanent = true) => {
    let currSubentity = -1;
    const delState = window.unigraph.getState(`temp/deleteChildren/${data.uid}`);
    if (!delState.value) delState.value = [];
    delState.value.push(index);
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const parents = getParents(data);
    const totalChildrenToCheck: string[] = [];
    children?.forEach((el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            const childrenUids: string[] = [
                el?._value?.uid,
                el?._value?._value?.uid,
                el?._value?._value?._value?.content?._value?.uid,
            ];
            getAllChildren(el?._value?._value?._value?.children, childrenUids);
            totalChildrenToCheck.push(...childrenUids.filter(Boolean));
        }
    });
    setTimeout(() => {
        window.unigraph.recalculateBacklinks(
            parents.map((el) => el.uid),
            totalChildrenToCheck,
        );
    }, 1000);
    setTimeout(() => {
        if (delState.value) {
            deleteChildren(
                data,
                context,
                delState.value.sort((a: any, b: any) => a - b),
                permanent,
            );
            delState.value = undefined;
        }
    }, 0);
};

export const deleteChildren = (data: any, context: NoteEditorContext, index: number[], permanent = true) => {
    let currSubentity = -1;
    let deleted = 0;
    const parents = getParents(data);
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const toDel: any[] = [];
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity') {
            currSubentity++;
            if (index.includes(currSubentity)) {
                deleted += 1;
                toDel.push(el);
                return prev;
            }
        }
        return [
            ...prev,
            {
                _index: { '_value.#i': el._index['_value.#i'] - deleted },
                _key: el._key,
                _value: {
                    uid: el._value.uid,
                },
            },
        ];
    }, []);

    addCommand(context.historyState.value, [
        {
            type: 'children',
            uid: data._value.uid,
            subsId: context.callbacks.subsId,
            oldChildrenUid: data._value.children?.uid,
            oldData: data._value?.children,
            focusUid: toDel[toDel.length - 1]?._value?._value?.uid,
            focusCaret: -1,
        },
    ]);

    window.unigraph.updateObject(
        data?._value?.uid,
        { children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren } },
        false,
        false,
        context.callbacks.subsId,
        parents,
        true,
    );
    focusLastDFSNode({ uid: toDel[0]._value._value.uid }, context, true, -1);

    setTimeout(() => {
        toDel.forEach((el) => {
            if (permanent && el?._value?._value?.['~_value']?.length <= 1) {
                permanentlyDeleteBlock(el._value._value);
            }
        });
    }, 1000);
    window.unigraph.touch(getParents(data).map((ell) => ell.uid));
};

export const unsplitChild = async (data: any, context: NoteEditorContext, index: number, currString: string) => {
    let currSubentity = -1;
    let prevIndex = -1;
    const parents = getParents(data);
    if (!data._hide) parents.push({ uid: data.uid });
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const delAt = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity') {
            currSubentity++;
            if (currSubentity === index) return elindex;
            if (currSubentity + 1 === index) prevIndex = elindex;
            return prev;
        }
        return prev;
    }, 0);
    const numChildParents = children[delAt]?._value?._value?.['~_value']?.length;
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    // console.log(index, children[delAt]?._value?._value?._value?.children?.['_value[']);
    // Index = 0 if current block doesn't have children, merge with parent
    // Index > 0 and last DFS is last item, should merge with previous
    if (
        currString === '' &&
        !(children[delAt]?._value?._value?._value?.children?.['_value['] || []).filter(
            (ch: any) => ch?._value?.type?.['unigraph.id'] === '$/schema/subentity',
        ).length
    ) {
        deleteChildren(data, context, [index], true);
    } else if (
        index === 0 &&
        !(children[delAt]?._value?._value?._value?.children?.['_value['] || []).filter(
            (ch: any) => ch?._value?.type?.['unigraph.id'] === '$/schema/subentity',
        ).length
    ) {
        // Merge with parent
        // 1. merge text
        // 2. merge children (remove delAt, shift indexes, add semantic children)
        const loc = data._value?.text || data._value?.name;
        const pred = data._value?.text ? 'text' : 'name';
        const undoCommand: CommandState = [
            {
                type: 'children',
                uid: data._value.uid,
                subsId: context.callbacks.subsId,
                oldChildrenUid: data._value.children?.uid,
                oldData: data._value?.children,
            },
            {
                type: 'textual',
                subsId: context.callbacks.subsId,
                uid: loc?._value?._value?.uid,
                oldText: loc?._value?._value?.['_value.%'],
            },
        ];
        const oldCaret = (loc?._value?._value?.['_value.%'] || '').length;
        const newText = (loc?._value?._value?.['_value.%'] || '') + currString;
        const newChildren = [
            ...children
                .map((el: any, iindex: number) =>
                    iindex === delAt
                        ? undefined
                        : {
                              _key: el._key,
                              _value: {
                                  uid: el._value.uid,
                              },
                              _index: {
                                  '_value.#i': iindex > delAt ? el._index['_value.#i'] - 1 : el._index['_value.#i'],
                              },
                          },
                )
                .filter(Boolean),
            ...(children[delAt]?._value?._value?._value?.children?.['_value['] || []).map((el: any) => ({
                _key: el._key,
                _value: {
                    uid: el._value.uid,
                },
                _index: { '_value.#i': el._index['_value.#i'] + children.length - 1 },
            })),
        ];
        addCommand(context.historyState.value, undoCommand);
        // console.log(newText, newChildren);
        window.unigraph.updateObject(
            data?._value?.uid,
            {
                [pred]: {
                    uid: loc?.uid,
                    _value: {
                        uid: loc?._value?.uid,
                        _value: { uid: loc?._value?._value?.uid, '_value.%': newText },
                    },
                },
                children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren },
            },
            false,
            false,
            context.callbacks.subsId,
            parents,
            true,
        );
        window.unigraph.getState('global/focused').setValue({
            uid: getLastDFSNode({ uid: children[delAt]._value._value.uid }, context).uid,
            caret: oldCaret || 0,
            type: '$/schema/note_block',
            newData: newText,
        });
    } else if (
        index > 0 &&
        getLastDFSNode({ uid: children[delAt]._value._value.uid }, context).uid ===
            children[prevIndex]?._value?._value?.uid
    ) {
        // Merge with previous
        // 1. merge children text
        // 2. merge children and grandchildren (for children, remove delAt and prevIndex, then append prevIndex's grandchildren)
        const loc =
            children[prevIndex]?._value?._value?._value?.text || children[prevIndex]?._value?._value?._value?.name;
        const pred = data._value?.text ? 'text' : 'name';
        const oldText = loc?._value?._value?.['_value.%'] || '';
        const newText = oldText + currString;
        const undoCommand: CommandState = [
            {
                type: 'textual',
                subsId: context.callbacks.subsId,
                uid: loc?._value?._value?.uid,
                oldText: loc?._value?._value?.['_value.%'],
            },
            {
                type: 'children',
                subsId: context.callbacks.subsId,
                uid: data._value.uid,
                oldChildrenUid: data._value?.children?.uid,
                oldData: data._value?.children,
            },
            {
                type: 'children',
                subsId: context.callbacks.subsId,
                uid: children[prevIndex]?._value?._value?._value?.uid,
                oldChildrenUid: children[prevIndex]?._value?._value?._value?.children
                    ? children[prevIndex]?._value?._value?._value?.children.uid
                    : window.unigraph.leaseUid?.(),
                oldData: getChildrenStubMap(children[prevIndex]?._value?._value?._value?.children || {}),
            },
        ];
        const newChildren = [
            ...children
                .map((el: any, iindex: number) =>
                    iindex === delAt || iindex === prevIndex
                        ? undefined
                        : {
                              _key: el._key,
                              _value: { uid: el._value.uid },
                              _index: {
                                  '_value.#i': iindex > delAt ? el._index['_value.#i'] - 1 : el._index['_value.#i'],
                              },
                          },
                )
                .filter(Boolean),
            {
                _index: { uid: children[prevIndex]?._index.uid },
                _key: children[prevIndex]?._key,
                _value: {
                    uid: children[prevIndex]?._value?.uid,
                    _value: {
                        uid: children[prevIndex]?._value?._value?.uid,
                        _value: {
                            uid: children[prevIndex]?._value?._value?._value?.uid,
                            [pred]: {
                                uid: children[prevIndex]?._value?._value?._value?.[pred]?.uid,
                                _value: {
                                    uid: children[prevIndex]?._value?._value?._value?.[pred]?._value?.uid,
                                    _value: {
                                        uid: children[prevIndex]?._value?._value?._value?.[pred]?._value?._value?.uid,
                                        '_value.%': newText,
                                    },
                                },
                            },
                            children: {
                                '_value[': [
                                    ...(children[delAt]?._value?._value?._value?.children?.['_value['] || []).map(
                                        (el: any) => ({
                                            _key: el._key,
                                            _value: { uid: el._value.uid },
                                            _index: { uid: el._index.uid },
                                        }),
                                    ),
                                ],
                            },
                        },
                    },
                },
            },
        ];
        addCommand(context.historyState.value, undoCommand);
        window.unigraph.updateObject(
            data?._value?.uid,
            { children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren } },
            false,
            false,
            context.callbacks.subsId,
            parents,
            true,
        );
        window.unigraph.getState('global/focused').setValue({
            uid: getLastDFSNode({ uid: children[delAt]._value._value.uid }, context).uid,
            caret: oldText.length || 0,
            type: '$/schema/note_block',
            newData: newText,
        });
    } else return false;

    // const numChildParents = childParentArray ? childParentArray.length : 0;
    if (numChildParents <= 1) {
        setTimeout(() => {
            permanentlyDeleteBlock(children[delAt]._value._value);
            window.unigraph.touch(getParents(data).map((el) => el.uid));
        }, 1000);
    }

    return true;
};

export const permanentlyDeleteBlock = (data: any, otherUids?: any[]) => {
    window.unigraph.deleteObject([data.uid, ...(otherUids || [])] as any);
};

export const indentChild = (data: any, context: NoteEditorContext, index: number, parent?: number) => {
    const indenters = window.unigraph.getState(`temp/indentChildren/${data.uid}`);
    if (!indenters.value) indenters.value = [];
    indenters.value.push(index);
    setTimeout(() => {
        if (indenters.value) {
            indentChildren(
                data,
                context,
                indenters.value.sort((a: any, b: any) => a - b),
                parent,
            );
            indenters.value = undefined;
        }
    }, 0);
};

/**
 * Indents a child node into their last sibling (or a specified element).
 *
 * The index is relative to all subentities (outliner children).
 *
 * TODO: This code is very poorly written. We need to change it after we have unigraph object prototypes.
 */
export const indentChildren = (data: any, context: NoteEditorContext, index: number[], parent?: number) => {
    const parents = getParents(data);
    if (!data._hide) parents.push({ uid: data.uid });
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    if (!parent && index[0] !== 0) {
        parent = index[0] - 1;
    } else if (!parent) {
        return;
    }
    const undoCommand: any[] = [];
    let currSubentity = -1;
    let isDeleted = 0;
    let parIndex: number | undefined;
    const newUid: any = [];
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.map((el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity') {
            currSubentity++;
            if (index.includes(currSubentity)) {
                isDeleted++;
                newUid.push({ uid: el._value.uid, _value: { uid: el._value._value.uid } });
                return undefined;
            }
            if (currSubentity === parent) {
                parIndex = elindex;
                return el;
            }
            if (isDeleted > 0)
                return {
                    _index: { '_value.#i': el._index['_value.#i'] - isDeleted },
                    _key: el._key,
                    _value: {
                        uid: el._value.uid,
                    },
                };
            return {
                _index: { uid: el._index?.uid, '_value.#i': el._index['_value.#i'] },
                _key: el._key,
                _value: {
                    uid: el._value.uid,
                },
            };
        }
        if (isDeleted > 0)
            return {
                _index: { '_value.#i': el._index['_value.#i'] - isDeleted },
                _key: el._key,
                _value: {
                    uid: el._value.uid,
                },
            };
        return {
            _index: { uid: el._index?.uid, '_value.#i': el._index['_value.#i'] },
            _key: el._key,
            _value: {
                uid: el._value.uid,
            },
        };
    });
    undoCommand.push({
        type: 'children',
        uid: data?._value?.uid,
        subsId: context.callbacks.subsId,
        oldChildrenUid: data?._value?.children?.uid,
        // oldData: data,
        oldData: getChildrenStubMap(data?._value?.children),
    });
    if (parIndex !== undefined) {
        const oldChildrenRefUid = children[parIndex]?._value?._value?._value.uid;
        const oldChildrenUid = children[parIndex]._value._value._value.children?.uid;
        if (oldChildrenUid)
            undoCommand.push({
                type: 'children',
                uid: oldChildrenRefUid,
                subsId: context.callbacks.subsId,
                oldChildrenUid,
                // oldData: newChildren[parIndex]._value._value._value,
                oldData: getChildrenStubMap(children[parIndex]._value._value?._value?.children),
            });

        newChildren[parIndex] = {
            uid: newChildren[parIndex].uid,
            _value: {
                uid: newChildren[parIndex]._value.uid,
                _value: {
                    uid: newChildren[parIndex]._value._value.uid,
                    _value: {
                        uid: newChildren[parIndex]._value._value._value.uid,
                        children: {
                            uid: undefined,
                            '_value[': [
                                ...(getSemanticChildren(newChildren[parIndex]._value._value)?.['_value['] || []).map(
                                    (el: any) => ({ uid: el?.uid }),
                                ),
                                ...newUid.map((el: any, idx: number) => ({
                                    _index: {
                                        '_value.#i':
                                            (getSemanticChildren(newChildren[parIndex as any]._value._value)?.[
                                                '_value['
                                            ]?.length || 0) + idx,
                                    }, // always append at bottom
                                    _value: el,
                                })),
                            ],
                        },
                    },
                },
            },
        };
    }
    addCommand(context.historyState.value, undoCommand);
    const finalChildren = newChildren.filter((el: any) => el !== undefined);
    window.unigraph.updateObject(
        data?._value?.uid,
        { children: { _displayAs: data?._value?.children?._displayAs, '_value[': finalChildren } },
        false,
        false,
        context.callbacks.subsId,
        parents,
        true,
    );
    window.unigraph.touch(parents.map((el) => el.uid));
    if (context?.edited?.current) context.edited.current = true;

    // context.setCommand(() => () => focusUid(newUid._value.uid));
    // context.setCommand(() => noteBlockCommands['set-focus'].bind(this, data, {...context, childrenref: {current: context.childrenref.current.children[parent as number].children[0].children[0].children[1]}}, -1))
};

export const unindentChild = async (data: any, context: NoteEditorContext, parent: number, index: number) => {
    const indenters = window.unigraph.getState(`temp/unindentChildren/${data.uid}/${parent}`);
    if (!indenters.value) indenters.value = [];
    indenters.value.push(index);
    setTimeout(() => {
        if (indenters.value) {
            unindentChildren(
                data,
                context,
                parent,
                indenters.value.sort((a: any, b: any) => a - b),
            );
            indenters.value = undefined;
        }
    }, 0);
};

export const unindentChildren = async (data: any, context: NoteEditorContext, parent: number, index: number[]) => {
    const parents = getParents(data);
    if (!data._hide) parents.push({ uid: data.uid });
    // removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    // console.log(parent, index)
    let currSubentity = -1;
    let isCompleted = false;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    let delUidPar = '';
    let delUidChild = '';
    const recalcBacklinkUids: string[] = [];
    const recalcParents: any[] = [];
    const undoCommand: any[] = [];
    const newChildren = children.reduce((prev: any[], curr: any) => {
        if (curr?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === parent) {
            recalcParents.push(curr._value._value.uid, ...getParents(curr._value._value).map((el) => el.uid));
            isCompleted = true;
            let currChildSubentity = -1;
            let childIsCompleted = 0;
            const targetChild: any[] = [];
            const childChildren = getSemanticChildren(curr._value._value)?.['_value['].sort(byElementIndex);
            const newChildChildren = childChildren.reduce((cprev: any[], ccurr: any) => {
                if (
                    ccurr?._value?.type?.['unigraph.id'] === '$/schema/subentity' &&
                    index.includes(++currChildSubentity)
                ) {
                    targetChild.push({
                        _key: ccurr._key,
                        _value: {
                            uid: ccurr._value.uid,
                        },
                        _index: { '_value.#i': curr._index['_value.#i'] + targetChild.length + 1 },
                    });
                    delUidChild = ccurr.uid;
                    const childrenUids = [ccurr._value.uid, ccurr._value._value.uid];
                    getAllChildren(ccurr._value._value._value.children, childrenUids);
                    recalcBacklinkUids.push(...childrenUids);
                    childIsCompleted += 1;
                    return cprev;
                }
                if (childIsCompleted > 0)
                    return [
                        ...cprev,
                        {
                            _key: ccurr._key,
                            _value: {
                                uid: ccurr._value.uid,
                            },
                            _index: {
                                '_value.#i': ccurr._index['_value.#i'] - childIsCompleted,
                            },
                        },
                    ];
                return [
                    ...cprev,
                    {
                        _index: { '_value.#i': ccurr._index['_value.#i'], uid: ccurr._index.uid },
                        _key: ccurr._key,
                        _value: {
                            uid: ccurr._value.uid,
                        },
                    },
                ];
            }, []);
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
            undoCommand.push({
                type: 'children',
                uid: curr._value._value._value.uid,
                subsId: context.callbacks.subsId,
                oldChildrenUid: curr._value._value._value.children?.uid,
                // oldData: newChildren[parIndex]._value._value._value,
                oldData: getChildrenStubMap(curr._value._value._value.children),
            });
            delUidPar = curr._value._value._value.children.uid;
            return [...prev, newParent, ...targetChild];
        }
        if (isCompleted)
            return [
                ...prev,
                {
                    _index: { '_value.#i': curr._index['_value.#i'] + index.length },
                    _key: curr._key,
                    _value: {
                        uid: curr._value.uid,
                    },
                },
            ];
        return [
            ...prev,
            {
                _index: { uid: curr._index?.uid, '_value.#i': curr._index['_value.#i'] },
                _key: curr._key,
                _value: {
                    uid: curr._value.uid,
                },
            },
        ];
    }, []);
    undoCommand.push({
        type: 'children',
        uid: data._value.uid,
        subsId: context.callbacks.subsId,
        oldChildrenUid: data._value.children?.uid,
        // oldData: newChildren[parIndex]._value._value._value,
        oldData: getChildrenStubMap(data._value.children),
    });
    addCommand(context.historyState.value, undoCommand);
    await window.unigraph.updateObject(
        data?._value?.uid,
        { ...data._value, children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren } },
        false,
        false,
        context.callbacks.subsId,
        parents,
        true,
    );
    if (recalcBacklinkUids.length >= 1) {
        setTimeout(() => {
            window.unigraph.recalculateBacklinks(_.uniq(recalcParents), recalcBacklinkUids);
        }, 1000);
    }
    window.unigraph.touch(parents.map((el) => el.uid));
    if (context?.edited?.current) context.edited.current = true;
    // context.setCommand(() => () => focusUid(newChildren[parent + 1]._value._value.uid));
};

export const focusLastDFSNode = (data: any, context: NoteEditorContext, goingUp?: boolean, caret?: number) => {
    focusUid(getLastDFSNode(data, context), goingUp, caret);
};

export const focusNextDFSNode = (data: any, context: NoteEditorContext, goingUp?: boolean, caret?: number) => {
    focusUid(getNextDFSNode(data, context), goingUp, caret);
};

export const getLastDFSNode = (data: any, context: NoteEditorContext) => {
    const orderedNodes = dfs(context.nodesState.value).filter((el) =>
        ['$/schema/note_block', '$/schema/embed_block'].includes((el as any).type),
    );
    const newIndex = orderedNodes.findIndex((el) => el.uid === data.uid) - 1;
    if (orderedNodes[newIndex] && !orderedNodes[newIndex].root) return orderedNodes[newIndex];
    return { uid: '' };
};

export const getNextDFSNode = (data: any, context: NoteEditorContext) => {
    const orderedNodes = dfs(context.nodesState.value).filter((el) =>
        ['$/schema/note_block', '$/schema/embed_block'].includes((el as any).type),
    );
    const newIndex = orderedNodes.findIndex((el) => el.uid === data.uid) + 1;
    if (orderedNodes[newIndex] && !orderedNodes[newIndex].root) return orderedNodes[newIndex];
    return { uid: '' };
};

export const convertChildToTodo = async (data: any, context: NoteEditorContext, index: number, currentText: string) => {
    const parents = getParents(data);
    if (!data._hide) parents.push({ uid: data.uid });
    removeAllPropsFromObj(data, ['~_value', '~unigraph.origin', 'unigraph.origin']);
    // console.log(index);
    let currSubentity = -1;
    const stubConverted: any = { _value: { uid: '' } };
    let todoUid = '';
    let childTypeLocation = '';
    let childOldTypeUid = '';
    let textIt = currentText || '';
    let refs: any[] = [];
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            /* something something */
            childTypeLocation = el._value._value.uid;
            childOldTypeUid = el._value._value.type.uid;
            if (
                el._value._value.type['unigraph.id'] === '$/schema/embed_block' &&
                el._value._value._value.content._value.type['unigraph.id'] === '$/schema/todo'
            ) {
                // Is already a todo, just toggle its completeness
                todoUid = el._value._value._value.content._value.uid;
            }
            const newel = {
                uid: el.uid,
                _index: { '_value.#i': elindex },
                _value: {
                    uid: el._value.uid,
                    _value: {
                        uid: el._value._value.uid,
                        type: { 'unigraph.id': '$/schema/embed_block' },
                        _value: {
                            uid: el._value._value._value.uid,
                            content: stubConverted,
                        },
                    },
                },
            };
            if (!textIt.length) textIt = el._value._value._value.text._value._value['_value.%'];
            refs =
                el._value._value._value?.children?.['_value[']
                    ?.filter?.((it: any) => it._key)
                    .map((ell: any) => ({
                        key: ell._key.slice(2, -2),
                        value: ell._value._value.uid,
                    })) || [];
            return [...prev, newel];
        }
        return [...prev, { uid: el.uid }];
    }, []);
    // console.log(textIt, newChildren, )
    if (todoUid) return;
    const schemas = await window.unigraph.getSchemas();
    const todoObj = parseTodoObject(textIt, refs);
    todoObj.uid = window.unigraph.leaseUid?.();
    clearEmpties(todoObj);
    console.log(todoObj);
    const paddedObj = buildUnigraphEntity(JSON.parse(JSON.stringify(todoObj)), '$/schema/todo', schemas);
    stubConverted._value = paddedObj;

    addCommand(context.historyState.value, [
        {
            type: 'predicate',
            subsId: context.callbacks.subsId,
            uid: childTypeLocation,
            predicate: 'type',
            oldValue: { uid: childOldTypeUid },
        },
    ]);

    // send fake update now
    window.unigraph.sendFakeUpdate?.(context.callbacks.subsId, {
        uid: data?._value?.uid,
        children: {
            _displayAs: data?._value?.children?._displayAs,
            '_value[': newChildren,
            uid: window.unigraph.leaseUid?.(),
        },
    });

    const focusedState = window.unigraph.getState('global/focused');
    focusedState.setValue({ ...focusedState.value, component: undefined });

    stubConverted._value = { uid: todoObj.uid };
    await window.unigraph.addObject(todoObj, '$/schema/todo');
    // eslint-disable-next-line prefer-destructuring
    await window.unigraph.updateObject(
        data?._value?.uid,
        { children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren } },
        false,
        false,
        context.callbacks.subsId,
        parents,
    );
    window.unigraph.touch(parents.map((el) => el.uid));
};

export const replaceChildWithEmbedUid = async (data: any, context: NoteEditorContext, index: number, uid: string) => {
    // console.log(index);
    let currSubentity = -1;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    let parentUid = '';
    let child: any = {};
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            /* something something */
            parentUid = el._value.uid;
            child = el._value._value;
            const newel = {
                uid: el.uid,
                _value: {
                    // subentity
                    uid: el._value.uid,
                    _value: {
                        type: { 'unigraph.id': '$/schema/embed_block' },
                        'dgraph.type': 'Entity',
                        _updatedAt: new Date().toISOString(),
                        _hide: true,
                        'unigraph.indexes': {},
                        _value: {
                            uid: el._value._value._value.uid,
                            content: {
                                _value: { uid },
                            },
                        },
                    },
                },
            };
            return [...prev, newel];
        }
        return [...prev, { uid: el.uid }];
    }, []);
    addCommand(context.historyState.value, [
        {
            type: 'predicate',
            uid: parentUid,
            subsId: context.callbacks.subsId,
            predicate: '_value',
            oldValue: { uid: child.uid },
            // oldData: newChildren[parIndex]._value._value._value,
            oldData: child,
        },
    ]);
    await window.unigraph.updateObject(
        data?._value?.uid,
        { children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren } },
        false,
        false,
        context.callbacks.subsId,
    );
    window.unigraph.touch(getParents(data).map((el) => el.uid));
};

export const replaceChildWithUid = async (data: any, context: NoteEditorContext, index: number, uid: string) => {
    // console.log(index);
    let currSubentity = -1;
    const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
    let parentUid = '';
    let child: any = {};
    const newChildren = children?.reduce((prev: any[], el: any, elindex: any) => {
        if (el?._value?.type?.['unigraph.id'] === '$/schema/subentity' && ++currSubentity === index) {
            /* something something */
            parentUid = el._value.uid;
            child = el._value._value;
            const newel = {
                _index: { uid: el._index.uid },
                _key: el._key,
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
    addCommand(context.historyState.value, [
        {
            type: 'predicate',
            uid: parentUid,
            subsId: context.callbacks.subsId,
            predicate: '_value',
            oldValue: { uid: child.uid },
            // oldData: newChildren[parIndex]._value._value._value,
            oldData: child,
        },
    ]);
    await window.unigraph.updateObject(
        data?._value?.uid,
        { children: { _displayAs: data?._value?.children?._displayAs, '_value[': newChildren } },
        false,
        false,
        context.callbacks.subsId,
    );
    window.unigraph.touch(getParents(data).map((el) => el.uid));
};

export const setChildrenDisplayAs = async (data: any, callbacks: any, mode: string) => {
    await window.unigraph.updateObject(
        data?._value?.uid,
        { children: { uid: data?._value?.children?.uid, _displayAs: mode } },
        true,
        false,
        callbacks.subsId,
        [],
        true,
    );
};
