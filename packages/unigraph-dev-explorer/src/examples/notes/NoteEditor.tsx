import { TextareaAutosize } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Actions } from 'flexlayout-react';
import _ from 'lodash';
import React from 'react';
import { blobToBase64, isUrl } from 'unigraph-dev-common/lib/utils/utils';
import { parseUnigraphHtml } from '../../clipboardUtils';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';
import { inlineTextSearch, inlineObjectSearch } from '../../components/UnigraphCore/InlineSearchPopup';
import { scrollIntoViewIfNeeded, selectUid, setCaret, TabContext } from '../../utils';
import { htmlToMarkdown } from '../semantic/Markdown';
import { permanentlyDeleteBlock } from './commands';
import { caretFromLastLine, caretToLastLine, closeScopeCharDict, setFocusedCaret } from './utils';

const PREFIX = 'NoteEditor';

const classes = {
    noteTextarea: `${PREFIX}-noteTextarea`,
};

const Root = styled(TextareaAutosize)(({ theme }) => ({
    [`& .${classes.noteTextarea}`]: {
        ...theme.typography.body1,
        border: 'none',
        outline: 'none',
        width: '100%',
    },
}));

type ScopeForAutoComplete = { currentText: string; caret: number; middle: string; end: string };
type ChangesForAutoComplete = { newText: string; newCaret: number; newCaretOffset: number };
type GetChangesForAutoComplete = (scope: ScopeForAutoComplete, ev: KeyboardEvent) => ChangesForAutoComplete;

const changesForOpenScopedChar = (
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
const changesForOpenScopedMarkdownLink = (scope: ScopeForAutoComplete, ev: KeyboardEvent): ChangesForAutoComplete => {
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

export const useNoteEditor: (...args: any) => [any, (text: string) => void, () => string, () => void, any] = (
    pullText: any,
    pushText: any,
    isEditing: boolean,
    setIsEditing: any,
    edited: any,
    focused: boolean,
    data: any,
    callbacks: any,
    componentId: any,
    editorContext: any,
    resetEdited: any,
    setCommand: any,
) => {
    const tabContext = React.useContext(TabContext);

    const inputterRef = React.useRef<any>();
    inputterRef.current = (text: string) => {
        if (data?._value?.children?.['_value[']) {
            const deadLinks: any = [];
            data._value.children['_value['].forEach((el: any) => {
                if (el && el._key && !text.includes(el._key)) deadLinks.push(el.uid);
            });
            if (deadLinks.length) window.unigraph.deleteItemFromArray(data._value.children.uid, deadLinks, data.uid);
        }

        return pushText(text);
    };

    const inputDebounced = React.useRef(_.debounce((...args) => inputterRef.current(...args), 333));
    const textInputRef: any = React.useRef();

    const handlePotentialResize = () => {
        const listener = () => {
            scrollIntoViewIfNeeded(textInputRef.current);
        };
        window.addEventListener('resize', listener);
        setTimeout(() => {
            window.removeEventListener('resize', listener);
        }, 1000);
    };

    const [caretPostRender, setCaretPostRender] = React.useState<number | undefined>(undefined);
    const fulfillCaretPostRender = React.useCallback(() => {
        if (caretPostRender !== undefined) {
            setCaret(document, textInputRef.current, caretPostRender);
            setCaretPostRender(undefined);
        }
    }, [caretPostRender]);

    React.useEffect(() => {
        const dataText = pullText();
        if (dataText && tabContext.viewId && !callbacks.isEmbed)
            window.layoutModel.doAction(Actions.renameTab(tabContext.viewId as any, `Note: ${dataText}`));
        if (getCurrentText() !== dataText && !edited.current) {
            setCurrentText(dataText);
        } else if ((getCurrentText() === dataText && edited.current) || getCurrentText() === '') {
            resetEdited();
        }

        if (!edited.current) fulfillCaretPostRender();
    }, [data, pullText, isEditing, fulfillCaretPostRender]);

    React.useEffect(() => {
        // set caret when focus changes
        if (focused) {
            const setCaretFn = () => {
                textInputRef?.current?.focus();
                let caret;
                const focusedState2 = window.unigraph.getState('global/focused').value;
                // const el = textInput.current?.firstChild || textInput.current;
                if (focusedState2.tail) {
                    // if coming from below
                    if (focusedState2.caret === -1) {
                        // caret -1 means we're landing at the end of the current block (by pressing arrow left)
                        caret = getCurrentText().length;
                    } else {
                        caret = caretToLastLine(getCurrentText(), focusedState2.caret);
                    }
                }

                if (focusedState2.newData) {
                    setCurrentText(focusedState2.newData);
                    delete focusedState2.newData;
                }
                // last caret might be coming from a longer line, or as -1
                caret = caret || _.min([_.max([focusedState2.caret, 0]), getCurrentText().length]);

                setCaret(document, textInputRef.current, caret);
            };
            if (!isEditing) {
                setIsEditing(true);
                setTimeout(setCaretFn, 0);
            } else {
                // textInput.current.focus();
                setCaretFn();
                handlePotentialResize();
            }
        }
    }, [focused]);

    const setCurrentText = (text: string) => {
        const nativeInputValueSetter = Object?.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value',
        )?.set;
        nativeInputValueSetter?.call(textInputRef.current, text);

        const event = new Event('change', { bubbles: true });
        textInputRef.current.dispatchEvent(event);
    };
    const getCurrentText = () => textInputRef.current.value;

    const checkReferences = React.useCallback(
        (matchOnly?: boolean) => {
            // const newContent = textInput.current.textContent;
            const newContent = getCurrentText();
            const caret = textInputRef.current.selectionStart;
            // Check if inside a reference block

            let hasMatch = false;
            hasMatch =
                inlineTextSearch(
                    getCurrentText(),
                    textInputRef,
                    caret,
                    async (match: any, newName: string, newUid: string) => {
                        const parents = getParentsAndReferences(data['~_value'], data['unigraph.origin'] || [])[0].map(
                            (el: any) => ({ uid: el.uid }),
                        );
                        if (!data._hide) parents.push({ uid: data.uid });
                        const newStr = `${newContent?.slice?.(0, match.index)}[[${newName}]]${newContent?.slice?.(
                            match.index + match[0].length,
                        )}`;
                        const semChildren = data?._value;
                        setCurrentText(newStr);
                        edited.current = true;
                        // resetEdited();
                        setCaret(document, textInputRef.current, match.index + newName.length + 4);
                        await window.unigraph.updateObject(
                            data.uid,
                            {
                                _value: {
                                    children: {
                                        '_value[': [
                                            {
                                                _index: {
                                                    '_value.#i': semChildren?.children?.['_value[']?.length || 0,
                                                },
                                                _key: `[[${newName}]]`,
                                                _value: {
                                                    'dgraph.type': ['Interface'],
                                                    type: { 'unigraph.id': '$/schema/interface/semantic' },
                                                    _hide: true,
                                                    _value: { uid: newUid },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                            true,
                            false,
                            callbacks.subsId,
                            parents,
                        );
                        window.unigraph.getState('global/searchPopup').setValue({ show: false });
                    },
                    undefined,
                    matchOnly,
                ) || hasMatch;
            hasMatch =
                inlineObjectSearch(
                    // textInput.current.textContent,
                    getCurrentText(),
                    textInputRef,
                    caret,
                    async (match: any, newName: string, newUid: string, newType: string) => {
                        if (!['$/schema/note_block', '$/schema/embed_block'].includes(newType)) {
                            callbacks['replace-child-with-embed-uid'](newUid);
                        } else {
                            callbacks['replace-child-with-uid'](newUid);
                            setTimeout(() => {
                                // callbacks['add-child']();
                                permanentlyDeleteBlock(data);
                            }, 500);
                        }
                        window.unigraph.getState('global/searchPopup').setValue({ show: false });
                        callbacks['focus-next-dfs-node'](data, editorContext, 0);
                    },
                    false,
                    matchOnly,
                ) || hasMatch;
            if (!hasMatch) {
                window.unigraph.getState('global/searchPopup').setValue({ show: false });
            }
        },
        [callbacks, componentId, data, data.uid, data?._value?.children?.uid, editorContext, resetEdited],
    );

    const onBlur = React.useCallback(() => {
        setIsEditing(false);
        inputDebounced.current.flush();
    }, []);

    React.useEffect(() => {
        const fn = (state: any) => {
            if (state.component !== componentId) return;
            checkReferences(true);
        };
        window.unigraph.getState('global/focused').subscribe(fn);
        return () => window.unigraph.getState('global/focused').unsubscribe(fn);
    }, [componentId, checkReferences]);

    const onInputHandler = React.useCallback(
        (ev) => {
            if (ev.target.value !== pullText()) {
                if (!edited.current) edited.current = true;
                checkReferences();
                inputDebounced.current(ev.target.value);
            }
        },
        [checkReferences, data, pullText],
    );

    const pasteLinkIntoSelection = React.useCallback((url: string) => {
        const caret = textInputRef.current.selectionStart;
        let middle = document.getSelection()?.toString() || '';
        let end = '';
        if (middle.endsWith(' ')) {
            middle = middle.slice(0, middle.length - 1);
            end = ' ';
        }
        setCurrentText(
            `${getCurrentText().slice(0, caret)}[${middle}](${url})${end}${getCurrentText().slice(
                caret + (middle + end).length,
            )}`,
        );
        setCaret(document, textInputRef.current, caret + middle.length + url.length + 4);

        textInputRef.current.dispatchEvent(
            new Event('change', {
                bubbles: true,
                cancelable: true,
            }),
        );
    }, []);

    const onPasteHandler = React.useCallback(
        (event) => {
            const paste = (event.clipboardData || (window as any).clipboardData).getData('text/html');

            const img = event.clipboardData.items[0];
            const text = event.clipboardData.getData('text');
            if (isUrl(text)) {
                // Notion-style paste url into selection
                const selection = window.getSelection();
                if (!selection?.rangeCount) return false;
                pasteLinkIntoSelection(text);
                event.preventDefault();
            } else if (paste.length > 0) {
                const selection = window.getSelection();
                if (!selection?.rangeCount) return false;
                selection?.deleteFromDocument();

                const unigraphHtml = parseUnigraphHtml(paste);
                if (unigraphHtml) {
                    const entities = Array.from(unigraphHtml.body.children[0].children).map((el) => el.id);
                    const childrenEntities = Array.from(unigraphHtml.body.children[0].children)
                        .map((el) => el.getAttribute('children-uids')?.split(','))
                        .flat();
                    callbacks['add-children'](entities, getCurrentText().length ? 0 : -1);
                    callbacks['add-parent-backlinks'](childrenEntities);
                } else {
                    const mdresult = htmlToMarkdown(paste);
                    const lines = mdresult.split('\n\n');

                    document.execCommand('insertText', false, lines[0]);

                    edited.current = true;

                    if (lines.length > 1) {
                        const newLines = lines.slice(1);
                        callbacks['add-children'](newLines, undefined, getCurrentText());
                    } else {
                        inputDebounced.current(getCurrentText());
                        inputDebounced.current.flush();
                    }
                }

                event.preventDefault();
            } else if (img.type.indexOf('image') === 0) {
                const blob = img.getAsFile();
                if (blob) {
                    event.preventDefault();

                    blobToBase64(blob).then((base64: string) => {
                        const selection = window.getSelection();
                        if (!selection?.rangeCount) return false;
                        selection?.deleteFromDocument();

                        const res = `![${blob.name || 'image'}](${base64})`;

                        selection.getRangeAt(0).insertNode(document.createTextNode(res));
                        selection.collapseToEnd();

                        edited.current = true;
                        inputDebounced.current(getCurrentText());
                        inputDebounced.current.flush();
                        return false;
                    });
                }
            }
            setFocusedCaret(textInputRef.current);
            return event;
        },
        [callbacks],
    );

    const handleScopedAutoComplete = React.useCallback(
        (changeTextAndCaret: GetChangesForAutoComplete, ev: KeyboardEvent) => {
            ev.preventDefault();
            const caret = textInputRef.current.selectionStart;
            let middle = document.getSelection()?.toString() || '';
            let end = '';
            if (middle.endsWith(' ')) {
                middle = middle.slice(0, middle.length - 1);
                end = ' ';
            }
            const { newText, newCaret, newCaretOffset } = changeTextAndCaret(
                { currentText: getCurrentText(), caret, middle, end },
                ev,
            );
            setCurrentText(newText);
            setCaret(document, textInputRef.current, newCaret, newCaretOffset);
            textInputRef.current.dispatchEvent(
                new Event('change', {
                    bubbles: true,
                    cancelable: true,
                }),
            );
            checkReferences();
        },
        [],
    );
    const handleOpenScopedChar = React.useCallback(
        (ev: KeyboardEvent) => handleScopedAutoComplete(changesForOpenScopedChar, ev),
        [],
    );
    const handleOpenScopedMarkdownLink = React.useCallback(
        (ev: KeyboardEvent) => handleScopedAutoComplete(changesForOpenScopedMarkdownLink, ev),
        [],
    );

    const onKeyDownHandler = React.useCallback(
        (ev) => {
            const caret = textInputRef.current.selectionStart;
            switch (ev.key) {
                case 'a': // "a" key
                    if (
                        ev.ctrlKey ||
                        (ev.metaKey && caret === 0 && textInputRef.current.selectionEnd === getCurrentText().length)
                    ) {
                        ev.preventDefault();
                        selectUid(componentId);
                        window.unigraph.getState('global/focused').setValue({ uid: '', caret: 0, type: '' });
                    }
                    break;

                case 'k': // "k" key
                    if (ev.ctrlKey || ev.metaKey) {
                        handleOpenScopedMarkdownLink(ev);
                    }
                    break;

                case 'Enter': // enter
                    if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
                        ev.preventDefault();
                        edited.current = false;
                        inputDebounced.current.cancel();
                        const currentText = getCurrentText() || pullText();
                        callbacks['split-child']?.(currentText, caret);
                        // setCurrentText(currentText.slice(caret));
                        setCaretPostRender(0);
                    } else if (ev.ctrlKey || ev.metaKey) {
                        ev.preventDefault();
                        edited.current = false;
                        inputDebounced.current.cancel();
                        callbacks['convert-child-to-todo']?.(getCurrentText());
                    }
                    break;

                case 'Tab': // tab
                    ev.preventDefault();
                    ev.stopPropagation();
                    inputDebounced.current.flush();
                    if (ev.shiftKey) {
                        setCommand(() => callbacks['unindent-child-in-parent']?.bind(null));
                    } else {
                        setCommand(() => callbacks['indent-child']?.bind(null));
                    }
                    break;

                case 'Backspace': // backspace
                    if (caret === 0 && document.getSelection()?.type === 'Caret') {
                        ev.preventDefault();
                        ev.stopPropagation();
                        inputDebounced.current.cancel();
                        edited.current = false;
                        callbacks['unsplit-child'](getCurrentText());
                    } else if (
                        Object.keys(closeScopeCharDict).includes(getCurrentText()[caret - 1]) &&
                        getCurrentText()[caret] === closeScopeCharDict[getCurrentText()[caret - 1]]
                    ) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        const tc = getCurrentText();
                        setCurrentText(tc.slice(0, caret - 1) + tc.slice(caret + 1));
                        setCaret(document, textInputRef.current, caret - 1);
                    }
                    break;

                case 'ArrowLeft': // left arrow
                    if (caret === 0) {
                        ev.preventDefault();
                        inputDebounced.current.flush();
                        callbacks['focus-last-dfs-node'](data, editorContext, true, -1);
                    }
                    break;

                case 'ArrowRight': // right arrow
                    if (caret === getCurrentText().length) {
                        ev.preventDefault();
                        inputDebounced.current.flush();
                        callbacks['focus-next-dfs-node'](data, editorContext, false, 0);
                    }
                    break;

                case 'ArrowUp': // up arrow
                    textInputRef.current.style['caret-color'] = 'transparent';
                    inputDebounced.current.flush();
                    requestAnimationFrame(() => {
                        const newCaret = textInputRef.current.selectionStart;
                        if (newCaret === 0) {
                            if (ev.shiftKey) {
                                selectUid(componentId, false);
                            }
                            callbacks['focus-last-dfs-node'](data, editorContext, true, caret);
                        }
                        setTimeout(() => {
                            textInputRef.current.style['caret-color'] = '';
                        }, 0);
                    });
                    return;

                case 'ArrowDown': // down arrow
                    textInputRef.current.style['caret-color'] = 'transparent';
                    inputDebounced.current.flush();
                    requestAnimationFrame(() => {
                        const newCaret = textInputRef.current.selectionStart;
                        if ((newCaret || 0) >= (getCurrentText().trim()?.length || 0)) {
                            if (ev.shiftKey) {
                                selectUid(componentId, false);
                            }

                            // when going from a line above, to a line below, the caret is at the end of the line
                            const caretInLine = caretFromLastLine(getCurrentText(), caret);
                            callbacks['focus-next-dfs-node'](data, editorContext, false, caretInLine);
                        }
                        setTimeout(() => {
                            textInputRef.current.style['caret-color'] = '';
                        }, 0);
                    });
                    return;
                case '(':
                case '[':
                case '"':
                case '`':
                case '$':
                    // handleOpenScopedChar(ev);
                    // break;
                    handleOpenScopedChar(ev);
                    break;

                case ']': // right bracket
                case ')':
                case '"':
                case '`':
                case '$':
                    if (!ev.shiftKey && getCurrentText()[caret] === ev.key) {
                        ev.preventDefault();
                        // setCaret(document, textInput.current, caret + 1);
                        setCaret(document, textInputRef.current, caret + 1);
                    }
                    break;

                default:
                    break;
            }
        },
        [callbacks, componentId, data, editorContext, handleOpenScopedChar, pullText],
    );

    return [
        <TextareaAutosize
            className={classes.noteTextarea}
            style={{
                outline: '0px solid transparent',
                minWidth: '16px',
                padding: '0px',
                display: isEditing ? '' : 'none',
                resize: 'none',
            }}
            ref={textInputRef}
            // value={currentText}
            // onChange={(event) => setCurrentText(event.target.value)}
            onChange={onInputHandler}
            onKeyDown={onKeyDownHandler}
            onPaste={onPasteHandler}
            onKeyUp={() => setFocusedCaret(textInputRef.current)}
            onClick={() => setFocusedCaret(textInputRef.current)}
        />,
        setCurrentText,
        getCurrentText,
        onBlur,
        textInputRef,
    ];
};
