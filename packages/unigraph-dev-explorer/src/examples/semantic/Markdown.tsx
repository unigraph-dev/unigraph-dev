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

const loadingIcon =
    "%3Csvg xmlns='http://www.w3.org/2000/svg' style='width:24px;height:24px' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z' /%3E%3C/svg%3E";

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

const remarkPlugins: any[] = [remarkMath, remarkWikilink, remarkBreaks];
const rehypePlugins: any[] = [rehypeKatex, rehypeRaw];

const tryFindLinkToAdd = async (hostObject: any, name: string, subsId: any) => {
    if (!hostObject) return;
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
    if (linkFound && hostObject.uid) {
        await window.unigraph.updateObject(
            hostObject.uid,
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

const SpanComponent = ({ className, hostObject, children, props, node, inline, subsId, namespaceLink }: any) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- this is a react component!
    const [searchCompleted, setSearchCompleted] = React.useState(false);
    const icon = searchCompleted ? defaultIcon : loadingIcon;
    let matches: any[] = [];
    let objDef: any;
    let obj: any;
    if (className?.includes('wikilink')) {
        matches = (hostObject?._value?.children?.['_value['] || []).filter(
            (el: any) => el?._key === `[[${children[0]}]]` && el?._value?.type,
        );
        objDef = window.unigraph.getNamespaceMap?.()?.[matches[0]?._value?._value?.type?.['unigraph.id']];
        [obj] = matches;
    }

    React.useEffect(() => {
        if (className?.includes('wikilink') && hostObject && !searchCompleted) {
            if (objDef || obj) return;

            setTimeout(async () => {
                await tryFindLinkToAdd(hostObject, children[0], subsId);
                setSearchCompleted(true);
            }, 100);
        }
    }, [className, children?.[0], hostObject?.uid, searchCompleted]);

    if (className?.includes('wikilink')) {
        return (
            <>
                <span
                    style={{ color: 'darkgray' }}
                    className="wikilink-bracket-left wikilink-brackets"
                    data-target={children[0]}
                >
                    [[
                </span>
                <div
                    className="wikilink-icon"
                    data-target={children[0]}
                    style={{
                        display: hostObject ? 'inline-flex' : 'none',
                        minWidth: '16px',
                        minHeight: '15px',
                        backgroundImage: `url("data:image/svg+xml,${objDef ? objDef?._icon : icon}")`,
                        opacity: 0.54,
                    }}
                />
                {
                    // eslint-disable-next-line react/no-children-prop
                    React.createElement('span', {
                        className,
                        'data-target': children[0],
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
                            else if (namespaceLink) {
                                window.open(namespaceLink(children[0]), '_blank');
                            } else {
                                // Create new note on click, then navigate to it
                                addPage(hostObject, children[0], subsId).then((navUid: any) => {
                                    window.wsnavigator(
                                        `/library/object?uid=${navUid}&viewer=${'dynamic-view-detailed'}&type=$/schema/note_block&name=${
                                            children[0]
                                        }`,
                                    );
                                });
                            }
                        },
                        ...props,
                        style: {
                            display: 'contents',
                            color: matches[0] || namespaceLink ? 'mediumblue' : 'cornflowerblue',
                            '&:hover': {
                                textDecoration: 'underline',
                            },
                            cursor: 'pointer',
                        },
                    })
                }
                <span
                    style={{ color: 'darkgray' }}
                    className="wikilink-bracket-right wikilink-brackets"
                    data-target={children[0]}
                >
                    ]]
                </span>
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
};

export const Markdown: DynamicViewRenderer = ({ data, callbacks, isHeading, style }) => {
    const hostObject = callbacks?.['get-semantic-properties']?.();

    const components = React.useMemo(() => {
        return {
            p: compFactory.bind(this, 'p'),
            strong: compFactory.bind(this, 'strong'),
            em: compFactory.bind(this, 'em'),
            code: (props: any) =>
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
            a: (props: any) =>
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
            span: ({ node, inline, className, children, ...props }: any) => (
                <SpanComponent
                    node={node}
                    inline={inline}
                    className={className}
                    props={props}
                    hostObject={hostObject}
                    namespaceLink={callbacks.namespaceLink}
                    subsId={callbacks.subsId}
                    key={`${children?.[0]}-span`}
                >
                    {children}
                </SpanComponent>
            ),
        };
    }, [
        data?.['_value.%'],
        JSON.stringify(
            (hostObject?._value?.children?.['_value[']?.sort() || [])?.map?.((el: any) => el?._key).filter(Boolean),
        ),
        callbacks.subsId,
        callbacks.namespaceLink,
    ]);

    const MarkdownComponent = React.useMemo(() => {
        return (
            <Typography
                variant={!isHeading ? 'body1' : 'h6'}
                style={{
                    opacity: data['_value.%'] || isHeading ? 'unset' : '0',
                    ...(style || {}),
                }}
            >
                <ReactMarkdown
                    className="react-markdown"
                    // eslint-disable-next-line react/no-children-prop
                    children={data['_value.%'] || (isHeading ? '_no title_' : '|')}
                    remarkPlugins={remarkPlugins}
                    rehypePlugins={rehypePlugins}
                    components={components}
                    rawSourcePos
                />
            </Typography>
        );
    }, [
        data?.['_value.%'],
        JSON.stringify(
            (hostObject?._value?.children?.['_value[']?.sort() || [])?.map?.((el: any) => el?._key).filter(Boolean),
        ),
        style,
    ]);
    return MarkdownComponent;
};
