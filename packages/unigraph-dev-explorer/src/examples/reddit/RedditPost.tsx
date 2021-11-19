import { Badge, Avatar, Typography } from "@material-ui/core";
import { registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { DynamicViewRenderer } from "../../global";
import Sugar from "sugar";
import { AddCircle, ArrowDownward, ArrowUpward, Chat, Image, Link, RemoveCircle } from "@material-ui/icons";
import React from "react";
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { openUrl } from "../../utils";

const getThumbnail = (url: string) => {
    if (url === "image") {
        return <Avatar variant="rounded"><Image/></Avatar>
    } else if (url === "default") {
        return <Avatar variant="rounded"><Link/></Avatar>
    } else if (url === "self") {
        return <Avatar variant="rounded"><Chat/></Avatar>
    } else {
        return <Avatar variant="rounded" src={url}></Avatar>
    }
}

export const Expand = ({expanded, toggleExpanded}: any) => {
    const style = {alignSelf: "center", marginRight: "8px"}
    return expanded ? <RemoveCircle onClick={() => {toggleExpanded(!expanded)}} style={style}/> : <AddCircle onClick={() => {toggleExpanded(!expanded)}} style={style}/> 
}

export const RedditPost: DynamicViewRenderer = ({data, callbacks}) => {
    const [innerExpanded, setInnerExpanded] = React.useState(false);

    return <div style={{display: "flex"}}>
        <div style={{alignSelf: "baseline", marginRight: "16px"}}>
            <ArrowUpward fontSize="small"/>
            <p style={{marginTop: "0px", marginBottom: "2px"}}>Vote</p>
            <ArrowDownward fontSize="small"/>
        </div>
    <div style={{alignSelf: "baseline", marginRight: "16px", marginTop: "8px"}}>
            <Badge
            overlap="circle"
            anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
            }}
            badgeContent={<Avatar style={{height: "16px", width: "16px"}} alt="Reddit" src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png" />}
        >
            {getThumbnail(data.get('thumbnail').as('primitive'))}
        </Badge>
            </div>
            
            <div>
                
                <Typography variant="body1" style={{marginRight: "8px"}}>{data.get('name').as("primitive")}</Typography>
                <div style={{display: "flex", color: "gray"}}>
                    <Expand expanded={innerExpanded} toggleExpanded={setInnerExpanded}/>
                    <div>
                        
                        <Typography variant="body2">Submitted {Sugar.Date.relative(new Date(data['_timestamp']['_updatedAt']))} to r/{data.get('subreddit/name').as('primitive')}</Typography>
                        <div style={{color: "gray", textDecoration: "underline", cursor: "pointer"}} onClick={() => {if (callbacks?.removeFromContext) callbacks.removeFromContext(); openUrl(data.get('permalink').as('primitive'))}}>Comment</div>
                    </div>
                </div>
                {innerExpanded ? <div>
                {data.get('selftext').as('primitive').length ? <AutoDynamicView object={new UnigraphObject(data.get('selftext')['_value']['_value'])}/> : <img src={data.get('url').as('primitive')} style={{maxWidth: "100%"}} alt=""/>}
            </div> : []}
            </div>
            
    </div>
} 

export const init = () => {
    registerDynamicViews({"$/schema/reddit_post": RedditPost});
}