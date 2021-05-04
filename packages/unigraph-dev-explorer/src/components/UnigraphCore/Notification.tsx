import { List, ListItem, ListItemText, Typography } from "@material-ui/core";
import React from "react";
import { registerDynamicViews, withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { DynamicViewRenderer } from "../../global";
import * as timeago from 'timeago.js';

export type ANotification = {
    uid?: string,
    name: string,
    from: string,
    content: string,
    actions?: any,
    _timestamp?: {
        _updatedAt: any
    }
}

const Notification: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: ANotification = unpad(data);

    return <React.Fragment>
        <ListItemText
          primary={unpadded.name}
          secondary={
            <React.Fragment>
              <Typography
                component="span"
                variant="body2"
                color="textPrimary"
                style={{paddingRight: "4px"}}
              >
                {unpadded.from}{", updated: "}{timeago.format(new Date(unpadded?._timestamp?._updatedAt))}:
              </Typography>
              {unpadded.content}
            </React.Fragment>
          }
        />
    </React.Fragment>
}

registerDynamicViews({"$/schema/notification": Notification});

export const NotificationCenterBody: React.FC<{data: ANotification[]}> = ({data}) => {
    return <div>
        <List>
            {data.map(it => <ListItem key={it.uid}>
                <Notification data={it} />
            </ListItem>)}
        </List>
    </div>
};

/*
export const NotificationCenter = withUnigraphSubscription(
    NotificationCenterBody, { schemas: [], defaultData: [], packages: [] },
    {
        afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
            window.unigraph.subscribeToType("$/schema/notification", (result: ANotification[]) => {setData(result.reverse())}, subsId);
        }
    }
)
*/

export const NotificationCenter = () => {
    const [data, setData] = React.useState(window.notifications);

    React.useEffect(() => {
        let len = window.notificationCallbacks.length;
        window.registerNotifications((ns) => setData(JSON.parse(JSON.stringify(ns)).reverse())); 

        return function cleanup() {
            delete window.notificationCallbacks[len];
        }
    })

    return <NotificationCenterBody data={data} />
}