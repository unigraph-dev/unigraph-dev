import _ from 'lodash';
import { byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';
import {
    addChild,
    addChildren,
    unsplitChild,
    splitChild,
    indentChild,
    deleteChild,
    unindentChild,
    convertChildToTodo,
    replaceChildWithUid,
    replaceChildWithEmbedUid,
    focusLastDFSNode,
    focusNextDFSNode,
} from './commands';

export const closeScopeCharDict: { [key: string]: string } = {
    '[': ']',
    '(': ')',
    '"': '"',
    '`': '`',
    $: '$',
    // '{':'}',
};

export const noteBlockCommands = {
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

export const caretFromLastLine = (text: string, _caret: number) => {
    // get position of caret in last line
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    const lastLineLength = lastLine.length;
    const caretInLine = _caret - (text.length - lastLineLength);
    return caretInLine;
};
export const caretToLastLine = (text: string, _caret: number) => {
    // get position of caret in last line
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    const lastLineLength = lastLine.length;
    const caretInLine = _caret + (text.length - lastLineLength);
    return caretInLine;
};

export const persistCollapsedNodes = (nodes: any) => {
    const localState = JSON.parse(window.localStorage.getItem('noteblockCollapsedByUid') || '{}');
    window.localStorage.setItem('noteblockCollapsedByUid', JSON.stringify({ ...localState, ...nodes }));
};

export const getShortcuts = (data: any, editorContext: any, elindex: any, copyOrCutHandler: any, callbacks: any) => ({
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

export const getCallbacks = (callbacks: any, data: any, editorContext: any, elindex: any) => ({
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

export const setFocusedCaret = (textInputEl: any) => {
    let caret;
    if (textInputEl.selectionStart !== undefined) {
        caret = textInputEl.selectionStart;
    } else {
        const sel = document.getSelection();
        caret = _.min([sel?.anchorOffset, sel?.focusOffset]) as number;
    }
    const state = window.unigraph.getState('global/focused');
    if (!state.value.tail) state.setValue({ ...state.value, caret });
};

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
