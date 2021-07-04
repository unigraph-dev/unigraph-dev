import { Avatar, Icon, Typography } from "@material-ui/core";
import { registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";
import { DynamicViewRenderer } from "../../global"
import Sugar from "sugar";

export const Tweet: DynamicViewRenderer = ({data, callbacks}) => {
    return <div style={{display: "flex"}}>
        <Avatar src={data.get('from_user/profile_image').as('primitive')} onClick={() => {window.open(`https://twitter.com/${data.get("from_user/username").as("primitive")}/status/${data.get('twitter_id').as("primitive")}`, "_blank")}}></Avatar>
        <div>
            <div style={{display: "flex"}}>
                <Typography variant="body1">{data.get('from_user/name').as("primitive")}</Typography>
                <Typography variant="body2">@{data.get('from_user/username').as("primitive")}, {Sugar.Date.relative(new Date(data['_timestamp']['_updatedAt']))}</Typography>
            </div>
            
            <AutoDynamicView object={data.get('text')['_value']['_value']} noContextMenu />
        </div>
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/tweet": Tweet});
}