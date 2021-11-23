import { Avatar, Badge, Typography } from "@material-ui/core";
import { registerDynamicViews } from "../../unigraph-react";
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";
import { DynamicViewRenderer } from "../../global"
import Sugar from "sugar";
import { externalNamespaces } from "../../externalNamespaceStub";
import { openUrl } from "../../utils";
import React from "react";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";

const removeContextEntities = (tweet: any, entities: any[]) => {
  let finalStr: string = tweet['_value.%'];
  entities.forEach(el => {
    if (typeof el['_key'] === "string") {
      finalStr = finalStr.replace(el['_key'], "");
    }
  });
  return {...tweet, '_value.%': finalStr};
}

export const Tweet: DynamicViewRenderer = ({data, callbacks}) => {
  const twid = data.get('from_user/twitter_id').as('primitive');
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
            
            <AutoDynamicView object={removeContextEntities(data.get('text')['_value']['_value'], data?.['_value']?.['children']?.['_value['] || [])} callbacks={{namespaceLink: nslnk}} noContextMenu />
            <div>
              {(data?.['_value']?.['children']?.['_value['] || []).map((el: any) => {
                const elObj = el['_value']['_value'];
                if (elObj['type']['unigraph.id'] === "$/schema/icon_url") {
                  return <img src={elObj['_value.%']} style={{maxWidth: "240px", borderRadius: "8px"}} alt=""/>
                } else if (elObj['type']['unigraph.id'] === "$/schema/web_bookmark") {
                  return <AutoDynamicView object={new UnigraphObject(elObj)} />
                } else return <React.Fragment/>
              })}
            </div>
        </div>
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/tweet": Tweet});
}