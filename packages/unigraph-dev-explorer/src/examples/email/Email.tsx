import { Avatar, ListItem, ListItemAvatar, ListItemText } from "@material-ui/core";
import React from "react";
import { registerDynamicViews, withUnigraphSubscription } from "../../unigraph-react"
import { pkg as emailPackage } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { DynamicViewRenderer } from "../../global";
import Sugar from 'sugar';
import { Link } from "@material-ui/icons";
import { getComponentFromPage } from "../../Workspace";
import { DynamicObjectListView } from "../../components/ObjectView/DynamicObjectListView";
import { UnigraphObject } from "unigraph-dev-common/lib/utils/utils";
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";

type AEmail = {
    name: string,
    message_id: string,
    message: {
        date_received: string,
        sender: string[],
        recipient: string[]
    },
    content: {
        text: string,
        abstract: string
    }
}

const EmailListBody: React.FC<{data: any[]}> = ({data}) => {

    return <DynamicObjectListView 
        items={data}
        context={null}
    />
}

const EmailMessage: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: AEmail = unpad(data);
    const fromPerson = (new UnigraphObject(data.get('message/sender')['_value['][0]?.['_value']?.['person']?.['_value']?.['_value']));
    const ider = data.get('message/sender')['_value['][0]?.['_value']?.['identifier']?.['_value.%'];
    return <ListItem>
        <ListItemAvatar><Avatar src={fromPerson?.get('profile_image')?.as('primitive') || ""}>{unpadded.message?.sender?.[0]?.[0]}</Avatar></ListItemAvatar>
        <ListItemText
            primary={[<strong><AutoDynamicView object={fromPerson} callbacks={{identifier: ider}} inline/></strong>, <br/>, data?.get('name')?.as('primitive')]}
            secondary={[Sugar.Date.relative(new Date(unpadded?.message?.date_received)), <div style={{display: "flex", alignItems: "center"}}>
                
                <Link onClick={() => {
                    const htmlUid = data?.get('content/text')?.['_value']?.['_value']?.['uid'];
                    if (htmlUid) window.newTab(window.layoutModel, getComponentFromPage('/library/object', {uid: htmlUid, context: data.uid, type: data?.type?.['unigraph.id']}));
                    if (callbacks?.removeFromContext) callbacks.removeFromContext();
                }}/>
                {unpadded.content?.abstract + "..."}
            </div>]}
        />
    </ListItem>
}

export const init = () => {
    registerDynamicViews({'$/schema/email_message': EmailMessage})
}

export const EmailList = withUnigraphSubscription(
    EmailListBody,
    { schemas: [], defaultData: [], packages: [emailPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/email_message", (result: any[]) => {setData(result.reverse())}, subsId, {metadataOnly: true});
    }}
)