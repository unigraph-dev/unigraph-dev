import { Avatar, Badge, Icon, Typography } from "@material-ui/core";
import { registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";
import { DynamicViewRenderer } from "../../global"
import Sugar from "sugar";
import { externalNamespaces } from "../../externalNamespaceStub";
import { openUrl } from "../../utils";

export const Tweet: DynamicViewRenderer = ({data, callbacks}) => {
  const twid = data.get('from_user/twitter_id').as('primitive');
  console.log(twid)
  const nslnk = externalNamespaces.filter(el => el.participants.includes(twid))[0]?.createLink;
  

    return <div style={{display: "flex"}}>
        <div style={{alignSelf: "center", marginRight: "16px"}}>
        <Badge
        overlap="circle"
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        badgeContent={<Avatar style={{height: "16px", width: "16px"}} alt="Twitter" src="https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png" />}
      >
        <Avatar src={data.get('from_user/profile_image').as('primitive')} onClick={() => {
          openUrl(`https://twitter.com/${data.get("from_user/username").as("primitive")}/status/${data.get('twitter_id').as("primitive")}`); 
          if (callbacks?.removeFromContext) callbacks.removeFromContext();
        }}></Avatar>
      </Badge>
        </div>
        
        <div>
            <div style={{display: "flex", alignItems: "center"}}>
                <Typography variant="body1" style={{marginRight: "8px"}}><strong>{data.get('from_user/name').as("primitive")}</strong></Typography>
                <Typography variant="body2" style={{color: "gray"}}>@{data.get('from_user/username').as("primitive")}, {Sugar.Date.relative(new Date(data['_timestamp']['_updatedAt']))}</Typography>
            </div>
            
            <AutoDynamicView object={data.get('text')['_value']['_value']} callbacks={{namespaceLink: nslnk}} noContextMenu />
        </div>
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/tweet": Tweet});
}