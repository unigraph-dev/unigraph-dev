import { Typography } from "@material-ui/core";
import React from "react";
import { DynamicViewRenderer } from "../../global";
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const compFactory = (name: string, {node, inline, className, children, ...props}: any) => {
    return React.createElement(name, {
        className, children,
        contentEditable: true,
        onClick: (event: MouseEvent) => { if (!(event.target as HTMLElement).getAttribute("markdownPos")) {
            console.log(props.sourcePosition);
            (event.target as HTMLElement).setAttribute("markdownPos", String((props.sourcePosition?.start.column || 0) - 1 + (window.getSelection()?.anchorOffset || 0)))};
        },
        ...props,
        style: {display: "contents"}
    })
}

export const Markdown: DynamicViewRenderer = ({data, callbacks, isHeading}) => {
    
    return <Typography
        variant={!isHeading ? "body1" : "h4"}
    >
        <ReactMarkdown children={data['_value.%']} remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]} components={{
            p: compFactory.bind(this, "p"),
            strong: compFactory.bind(this, "strong"),
            em: compFactory.bind(this, "em"),
            code: compFactory.bind(this, "code"),
        }} rawSourcePos/>
    </Typography>
}