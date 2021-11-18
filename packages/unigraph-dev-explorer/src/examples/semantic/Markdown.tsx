import { Typography } from "@material-ui/core";
import React from "react";
import { DynamicViewRenderer } from "../../global";
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkWikilink from './wikilink'
import remarkBreaks from 'remark-breaks'
import 'katex/dist/katex.min.css'

const compFactory = (name: string, {node, inline, className, children, ...props}: any) => {
    return React.createElement(name, {
        className, children,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onClick: (event: MouseEvent) => { if (!(event.target as HTMLElement).getAttribute("markdownPos")) {
            console.log(props.sourcePosition);
            (event.target as HTMLElement).setAttribute("markdownPos", String((props.sourcePosition?.start.column || 0) - 1 + (window.getSelection()?.anchorOffset || 0)))};
        },
        ...props,
        style: {...props.style, display: "contents"}
    })
}

export const Markdown: DynamicViewRenderer = ({data, callbacks, isHeading}) => {
    
    return <Typography
        variant={!isHeading ? "body1" : "h4"}
    >
        <ReactMarkdown children={data['_value.%']} remarkPlugins={[remarkMath, remarkWikilink, remarkBreaks]}
            rehypePlugins={[rehypeKatex]} components={{
            p: compFactory.bind(this, "p"),
            strong: compFactory.bind(this, "strong"),
            em: compFactory.bind(this, "em"),
            code: compFactory.bind(this, "code"),
            ol: (props) => compFactory('ol', {...props, inline: true, style: {marginLeft: "8px"}}),
            span: ({node, inline, className, children, ...props}: any) => {
                if (className?.includes('wikilink')) {
                    const matches = (callbacks?.['get-semantic-properties']?.()?.['_value']?.['children']?.['_value['] || [])
                        .filter((el: any) => el['_key'] === `[[${children[0]}]]`);
                    return <React.Fragment>
                        <span style={{color: "darkgray"}}>[[</span>
                        {/*callbacks?.namespaceLink ? <Public style={{height: "16px"}}/> : []*/}
                        {React.createElement('span', {
                            className, children,
                            contentEditable: true,
                            suppressContentEditableWarning: true,
                            onClick: (event: MouseEvent) => {
                                event.stopPropagation();
                                event.preventDefault();
                                if (matches[0]) window.wsnavigator(`/library/object?uid=${matches[0]._value._value.uid}&viewer=${"dynamic-view-detailed"}`);
                                else if (callbacks?.namespaceLink) {window.open(callbacks.namespaceLink(children[0]), "_blank")}
                            },
                            ...props,
                            style: {display: "contents", color: (matches[0] || callbacks?.namespaceLink) ? "mediumblue" : "black", ':hover':{
                                textDecoration: 'underline',
                            }}
                        })}
                        <span style={{color: "darkgray"}}>]]</span>
                    </React.Fragment>
                } else return React.createElement('span', {
                    className, children, inline, node,
                    ...props
                });
            }
        }} rawSourcePos/>
    </Typography>
}