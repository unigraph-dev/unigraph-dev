import { Typography } from '@mui/material';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';
import './react-markdown.css';
import TurndownService from 'turndown';
import rehypeRaw from 'rehype-raw';
import { DynamicViewRenderer } from '../../global.d';
import remarkWikilink from './wikilink';
import { getCaret } from '../../utils';

export function htmlToMarkdown(html: string) {
    TurndownService.prototype.escape = (input: string) => input;
    const turndown = new (TurndownService as any)({
        preformattedCode: true,
    });
    return turndown.turndown(html);
}

const getTextNodes = (root: any) => {
    const children: any[] = [];
    root.children.forEach((el: any) => {
        if (el.children) children.push(...getTextNodes(el));
        else if (el.type === 'text') children.push({ position: root.position, ...el });
    });
    return children;
};

const defaultIcon =
    "%3Csvg xmlns='http://www.w3.org/2000/svg' style='width:24px;height:24px' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M5 19V5H12V12H19V13C19.7 13 20.37 13.13 21 13.35V9L15 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H13.35C13.13 20.37 13 19.7 13 19H5M14 4.5L19.5 10H14V4.5M23 18V20H20V23H18V20H15V18H18V15H20V18H23Z' /%3E%3C/svg%3E";

const compFactory = (name: string, { node, inline, className, children, ...props }: any) =>
    // eslint-disable-next-line react/no-children-prop
    React.createElement(name, {
        className,
        children,
        onPointerUp: (event: PointerEvent) => {
            const currentText = (window.getSelection() as any).anchorNode?.textContent;
            const currentNode = getTextNodes(node).filter((el: any) => el.value === currentText)[0];
            const currentPos = currentNode?.position?.start?.offset || 0;
            if (!(event.target as HTMLElement).getAttribute('markdownPos')) {
                (event.target as HTMLElement).setAttribute('markdownPos', String(currentPos + getCaret(event)));
            }
        },
        ...props,
        style: { display: 'contents', ...props.style },
    });

const addPage = async (childrenRoot: any, newName: any, subsId: any) => {
    if (!childrenRoot) throw new Error("We can't add a page to which that doesn't exist");
    const newUid = await window.unigraph.addObject(
        {
            text: {
                _value: newName,
                type: { 'unigraph.id': '$/schema/markdown' },
            },
        },
        '$/schema/note_block',
    );
    if (childrenRoot.uid)
        window.unigraph.updateObject(
            childrenRoot.uid,
            {
                _value: {
                    children: {
                        '_value[': [
                            {
                                _key: `[[${newName}]]`,
                                _value: {
                                    'dgraph.type': ['Interface'],
                                    type: { 'unigraph.id': '$/schema/interface/semantic' },
                                    _hide: true,
                                    _value: { uid: newUid[0] },
                                },
                            },
                        ],
                    },
                },
            },
            true,
            false,
            subsId,
        );
    return newUid[0];
};

const tryFindLinkToAdd = async (childrenRoot: any, name: string, subsId: any) => {
    if (!childrenRoot) return;
    const res = await window.unigraph.getQueries([
        `(func: uid(parentUid)) {
            uid
            type {<unigraph.id>}
            popularity: count(<unigraph.origin>)
        }
        k as var(func: eq(<_value.%>, "${name}")) {
            <_value.%>
            type {<unigraph.id>}
            unigraph.origin @filter(type(Entity) AND not uid(k)) {
                    parentUid as uid
            }
        }`,
    ]);
    const linkFound = res[0].sort((a: any, b: any) => b.popularity - a.popularity)[0];
    if (linkFound && childrenRoot.uid) {
        console.log('k');
        window.unigraph.updateObject(
            childrenRoot.uid,
            {
                _value: {
                    children: {
                        '_value[': [
                            {
                                _key: `[[${name}]]`,
                                _value: {
                                    'dgraph.type': ['Interface'],
                                    type: { 'unigraph.id': '$/schema/interface/semantic' },
                                    _hide: true,
                                    _value: { uid: linkFound.uid },
                                },
                            },
                        ],
                    },
                },
            },
            true,
            false,
            subsId,
        );
    }
};

export const Markdown: DynamicViewRenderer = ({ data, callbacks, isHeading }) => {
    const timeout = React.useRef<any>(0);

    const MarkdownComponent = React.useMemo(() => {
        return (
            <Typography
                variant={!isHeading ? 'body1' : 'h4'}
                style={{
                    opacity: data['_value.%'] || isHeading ? 'unset' : '0',
                }}
            >
                <ReactMarkdown
                    className="react-markdown"
                    // eslint-disable-next-line react/no-children-prop
                    children={data['_value.%'] || (isHeading ? '_no title_' : '|')}
                    remarkPlugins={[remarkMath as any, remarkWikilink, remarkBreaks as any]}
                    rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                    components={{
                        p: compFactory.bind(this, 'p'),
                        strong: compFactory.bind(this, 'strong'),
                        em: compFactory.bind(this, 'em'),
                        code: (props) =>
                            compFactory('code', {
                                ...props,
                                style: {
                                    display: '',
                                    wordBreak: 'break-word',
                                    fontSize: '0.8em',
                                    padding: '3px',
                                    backgroundColor: 'whitesmoke',
                                    border: '1px solid lightgray',
                                    borderRadius: '4px',
                                },
                            }),
                        img: ({ node, inline, className, children, ...props }: any) => {
                            console.log(node);
                            return compFactory('img', {
                                ...props,
                                node,
                                inline,
                                className,
                                children,
                                style: {
                                    display: '',
                                    maxWidth: '100%',
                                    // eslint-disable-next-line no-nested-ternary
                                    height: node?.properties?.alt?.startsWith?.('inline:') ? '1.5em' : '',
                                },
                            });
                        },
                        a: (props) =>
                            compFactory('a', {
                                ...props,
                                onPointerUp: (ev: any) => {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    window.open((props?.node as any)?.properties?.href, '_blank');
                                },
                                target: '_blank',
                                style: { cursor: 'pointer' },
                            }),
                        // TODO: optimize this
                        // eslint-disable-next-line react/no-unstable-nested-components
                        span: ({ node, inline, className, children, ...props }: any) => {
                            if (className?.includes('wikilink')) {
                                const matches = (
                                    callbacks?.['get-semantic-properties']?.()?._value?.children?.['_value['] || []
                                ).filter((el: any) => el._key === `[[${children[0]}]]` && el._value?.type);
                                const objDef =
                                    window.unigraph.getNamespaceMap?.()?.[
                                        matches[0]?._value?._value?.type?.['unigraph.id']
                                    ];
                                if (!objDef) {
                                    if (timeout.current) clearTimeout(timeout.current);
                                    timeout.current = setTimeout(
                                        () =>
                                            tryFindLinkToAdd(
                                                callbacks?.['get-semantic-properties']?.(),
                                                children[0],
                                                callbacks.subsId,
                                            ),
                                        100,
                                    );
                                }
                                return (
                                    <>
                                        <span style={{ color: 'darkgray' }}>[[</span>
                                        <div
                                            style={{
                                                display: 'inline-flex',
                                                minWidth: '16px',
                                                minHeight: '15px',
                                                backgroundImage: `url("data:image/svg+xml,${
                                                    objDef ? objDef?._icon : defaultIcon
                                                }")`,
                                                opacity: 0.54,
                                            }}
                                        />
                                        {
                                            // eslint-disable-next-line react/no-children-prop
                                            React.createElement('span', {
                                                className,
                                                children,
                                                contentEditable: true,
                                                suppressContentEditableWarning: true,
                                                onClick: (event: MouseEvent) => {
                                                    event.stopPropagation();
                                                    event.preventDefault();
                                                    if (matches[0])
                                                        window.wsnavigator(
                                                            `/library/object?uid=${
                                                                matches[0]._value._value.uid
                                                            }&viewer=${'dynamic-view-detailed'}&type=${
                                                                matches[0]._value._value?.type?.['unigraph.id']
                                                            }&name=${children[0]}`,
                                                        );
                                                    else if (callbacks?.namespaceLink) {
                                                        window.open(callbacks.namespaceLink(children[0]), '_blank');
                                                    } else {
                                                        // Create new note on click, then navigate to it
                                                        const childrenRoot = callbacks?.['get-semantic-properties']?.();
                                                        addPage(childrenRoot, children[0], callbacks.subsId).then(
                                                            (navUid: any) => {
                                                                window.wsnavigator(
                                                                    `/library/object?uid=${navUid}&viewer=${'dynamic-view-detailed'}&type=$/schema/note_block&name=${
                                                                        children[0]
                                                                    }`,
                                                                );
                                                            },
                                                        );
                                                    }
                                                },
                                                ...props,
                                                style: {
                                                    display: 'contents',
                                                    color:
                                                        matches[0] || callbacks?.namespaceLink
                                                            ? 'mediumblue'
                                                            : 'cornflowerblue',
                                                    '&:hover': {
                                                        textDecoration: 'underline',
                                                    },
                                                    cursor: 'pointer',
                                                },
                                            })
                                        }
                                        <span style={{ color: 'darkgray' }}>]]</span>
                                    </>
                                );
                            }
                            // eslint-disable-next-line react/no-children-prop
                            return React.createElement('span', {
                                className,
                                children,
                                inline,
                                node,
                                ...props,
                            });
                        },
                    }}
                    rawSourcePos
                />
            </Typography>
        );
    }, [
        data['_value.%'],
        JSON.stringify(
            (callbacks?.['get-semantic-properties']?.()?._value?.children?.['_value[']?.sort() || [])?.map?.(
                (el: any) => el?._key,
            ),
        ),
    ]);
    return MarkdownComponent;
};
