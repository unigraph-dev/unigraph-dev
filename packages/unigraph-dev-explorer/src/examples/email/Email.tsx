import { List, ListItem } from "@material-ui/core";
import React from "react";
import { registerDynamicViews, withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { pkg as emailPackage } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";

const EmailListBody: React.FC<{data: any[]}> = ({data}) => {

    return <div>
        <List>
            {data.map(it => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </List>
    </div>
}

export const EmailList = withUnigraphSubscription(
    EmailListBody,
    { schemas: [], defaultData: [], packages: [emailPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/email_message", (result: any[]) => {setData(result.reverse())}, subsId);
    }}
)