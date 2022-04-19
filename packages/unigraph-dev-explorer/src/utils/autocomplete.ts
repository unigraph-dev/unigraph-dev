import { isUrl } from 'unigraph-dev-common/lib/utils/utils';
import { setCaret } from '../utils';

export const closeScopeCharDict: { [key: string]: string } = {
    '[': ']',
    '(': ')',
    '"': '"',
    '`': '`',
    $: '$',
    // '{':'}',
};

export type ScopeForAutoComplete = { currentText: string; caret: number; middle: string; end: string };
export type ChangesForAutoComplete = { newText: string; newCaret: number; newCaretOffset: number };
export type GetChangesForAutoComplete = (scope: ScopeForAutoComplete, ev: KeyboardEvent) => ChangesForAutoComplete;

export const changesForOpenScopedChar = (
    { currentText, caret, middle, end }: ScopeForAutoComplete,
    ev: KeyboardEvent,
): ChangesForAutoComplete => {
    const isChar = (c: string) => c !== ' ' && c !== '\n' && c !== '\t' && c !== undefined;
    const nextChar = currentText?.[caret];
    const shouldNotOpen = middle.length === 0 && isChar(nextChar) && nextChar !== closeScopeCharDict[ev.key];

    return {
        newText: `${currentText.slice(0, caret)}${ev.key}${middle}${
            shouldNotOpen ? '' : closeScopeCharDict[ev.key]
        }${end}${currentText.slice(caret + (middle + end).length)}`,
        newCaret: caret + 1,
        newCaretOffset: middle.length,
    };
};
export const changesForOpenScopedMarkdownLink = (
    scope: ScopeForAutoComplete,
    ev: KeyboardEvent,
): ChangesForAutoComplete => {
    const { currentText, caret, middle, end } = scope;

    if (isUrl(middle)) {
        return {
            newText: `${currentText.slice(0, caret)}[](${middle})${end}${currentText.slice(
                caret + (middle + end).length,
            )}`,
            newCaret: caret + 1,
            newCaretOffset: 0,
        };
    }
    return {
        newText: `${currentText.slice(0, caret)}[${middle}]()${end}${currentText.slice(caret + (middle + end).length)}`,
        newCaret: caret + middle.length + 3,
        newCaretOffset: 0,
    };
};

export const handleScopedAutoComplete = (
    changeTextAndCaret: GetChangesForAutoComplete,
    ev: KeyboardEvent,
    textInputRef: React.RefObject<HTMLInputElement>,
    currentText: string,
    setInput: any,
) => {
    ev.preventDefault();
    const caret = (textInputRef.current as any).selectionStart;
    let middle = document.getSelection()?.toString() || '';
    let end = '';
    if (middle.endsWith(' ')) {
        middle = middle.slice(0, middle.length - 1);
        end = ' ';
    }
    const { newText, newCaret, newCaretOffset } = changeTextAndCaret({ currentText, caret, middle, end }, ev);
    setInput(newText);
    setTimeout(() => setCaret(document, textInputRef.current, newCaret, newCaretOffset), 0);
    (textInputRef.current as any).dispatchEvent(
        new Event('change', {
            bubbles: true,
            cancelable: true,
        }),
    );
    return newText;
};
export const handleOpenScopedChar = (ev: KeyboardEvent, textInputRef: any, currentText: string, setInput: any) =>
    handleScopedAutoComplete(changesForOpenScopedChar, ev, textInputRef, currentText, setInput);
export const handleOpenScopedMarkdownLink = (
    ev: KeyboardEvent,
    textInputRef: any,
    currentText: string,
    setInput: any,
) => handleScopedAutoComplete(changesForOpenScopedMarkdownLink, ev, textInputRef, currentText, setInput);
