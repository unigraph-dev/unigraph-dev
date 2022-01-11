import { List, ListItem, ListItemText, Typography } from '@material-ui/core';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import * as timeago from 'timeago.js';
import { DynamicViewRenderer } from '../../global.d';

export type ANotification = {
    uid?: string;
    name: string;
    from: string;
    content: string;
    actions?: any;
    _updatedAt: any;
};

export const Notification: DynamicViewRenderer = ({ data, callbacks }) => {
    const unpadded: ANotification = unpad(data);

    return (
        <ListItemText
            primary={unpadded.name}
            secondary={
                <>
                    <Typography component="span" variant="body2" color="textPrimary" style={{ paddingRight: '4px' }}>
                        <span style={{ color: 'gray' }}>From: </span>
                        {unpadded.from}
                        <span style={{ color: 'gray' }}>, updated: </span>
                        {timeago.format(new Date(unpadded?._updatedAt))}
                    </Typography>
                    <Typography variant="body2" style={{ whiteSpace: 'pre' }}>
                        {unpadded.content}
                    </Typography>
                </>
            }
        />
    );
};

export const NotificationCenterBody: React.FC<{ data: ANotification[] }> = ({ data }) => {
    data = [...data].reverse();
    return (
        <div>
            <List>
                {data.map((it) => (
                    <ListItem key={it.uid}>
                        <Notification data={it} />
                    </ListItem>
                ))}
            </List>
        </div>
    );
};

export function NotificationCenter() {
    const nfState = window.unigraph.getState('notification-center/notifications');

    const [data, setData] = React.useState(nfState.value);

    nfState.subscribe((v) => setData(v));

    return <NotificationCenterBody data={data} />;
}
