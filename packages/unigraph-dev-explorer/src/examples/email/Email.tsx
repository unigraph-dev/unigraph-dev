import { Avatar, List, ListItem, ListItemAvatar, ListItemText } from "@material-ui/core";
import React from "react";
import { registerDynamicViews, withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { pkg as emailPackage } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { unpad, byUpdatedAt } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";
import { DynamicViewRenderer } from "../../global";
import * as timeago from 'timeago.js';

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

    return <div>
        <List>
            {data.sort(byUpdatedAt).reverse().map(it => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </List>
    </div>
}

const EmailMessage: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: AEmail = unpad(data);
    console.log(unpadded);
    return <ListItem>
        <ListItemAvatar><Avatar>{unpadded.message.sender[0][0]}</Avatar></ListItemAvatar>
        <ListItemText primary={unpadded.name} secondary={unpadded.content?.abstract+"..."}></ListItemText>
        <ListItemText style={{flex: "none"}} secondary={timeago.format(new Date(unpadded?.message?.date_received))}></ListItemText>
    </ListItem>
}

registerDynamicViews({'$/schema/email_message': EmailMessage})

export const EmailList = withUnigraphSubscription(
    EmailListBody,
    { schemas: [], defaultData: [], packages: [emailPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/email_message", (result: any[]) => {setData(result.reverse())}, subsId);
    }}
)