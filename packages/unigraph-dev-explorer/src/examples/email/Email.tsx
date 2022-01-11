import { Avatar, ListItem as div, ListItemAvatar, ListItemText } from '@material-ui/core';
import React from 'react';
import { pkg as emailPackage } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { byUpdatedAt, unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Sugar from 'sugar';
import { Link } from '@material-ui/icons';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicViewRenderer } from '../../global.d';
import { getComponentFromPage } from '../../utils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { registerDetailedDynamicViews, registerDynamicViews, withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { AutoDynamicViewDetailed } from '../../components/ObjectView/AutoDynamicViewDetailed';

type AEmail = {
    name: string;
    message_id: string;
    message: {
        date_received: string;
        sender: string[];
        recipient: string[];
    };
    content: {
        text: string;
        abstract: string;
    };
};

const EmailListBody: React.FC<{ data: any[] }> = ({ data }) => (
    <DynamicObjectListView items={data} context={null} compact />
);

const EmailMessageDetailed: DynamicViewRenderer = ({ data, callbacks }) => {
    return (
        <AutoDynamicViewDetailed
            callbacks={{ ...callbacks, context: data }}
            object={data?.get('content/text')?._value?._value}
            context={data}
        />
    );
};

const EmailMessage: DynamicViewRenderer = ({ data, callbacks }) => {
    const unpadded: AEmail = unpad(data);
    const fromPerson = new UnigraphObject(data.get('message/sender')['_value['][0]?._value?.person?._value?._value);
    const ider = data.get('message/sender')['_value['][0]?._value?.identifier?.['_value.%'];
    return (
        <div
            style={{ display: 'contents' }}
            onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                window.newTab(
                    window.layoutModel,
                    getComponentFromPage('/library/object', {
                        uid: data.uid,
                        type: data?.type?.['unigraph.id'],
                    }),
                );
                if (callbacks?.removeFromContext && callbacks?.removeOnEnter) callbacks.removeFromContext();
            }}
        >
            <ListItemAvatar>
                <Avatar src={fromPerson?.get('profile_image')?.as('primitive') || ''}>
                    {data.get('message/sender')['_value['][0]?._value?.identifier?.['_value.%']?.[0]?.toUpperCase?.()}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={[
                    <strong>
                        <AutoDynamicView object={fromPerson} callbacks={{ identifier: ider }} inline />
                    </strong>,
                    <br />,
                    data?.get('name')?.as('primitive'),
                ]}
                secondary={[
                    Sugar.Date.relative(new Date(unpadded?.message?.date_received)),
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link />
                        {`${unpadded.content?.abstract}...`}
                    </div>,
                ]}
            />
        </div>
    );
};

export const init = () => {
    registerDynamicViews({ '$/schema/email_message': EmailMessage });
    registerDetailedDynamicViews({
        '$/schema/email_message': EmailMessageDetailed,
    });
};

export const EmailList = withUnigraphSubscription(
    EmailListBody,
    { schemas: [], defaultData: [], packages: [emailPackage] },
    {
        afterSchemasLoaded: (subsId: number, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType(
                '$/schema/email_message',
                (result: any[]) => {
                    setData(result.sort(byUpdatedAt).reverse());
                },
                subsId,
                { metadataOnly: true },
            );
        },
    },
);
