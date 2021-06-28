import { Typography } from "@material-ui/core";
import React from "react";
import { DynamicViewRenderer } from "../../global";

const md = require('markdown-it')();

export const Markdown: DynamicViewRenderer = ({data, callbacks, isHeading}) => {
    
    return <Typography
        variant={!isHeading ? "body1" : "h4"}
    ><span dangerouslySetInnerHTML={{__html: md.renderInline(data['_value.%'] || "")}}/></Typography>
}