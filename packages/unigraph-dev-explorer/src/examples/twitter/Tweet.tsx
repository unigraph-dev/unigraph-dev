import { Avatar, Badge, Typography } from '@mui/material';
import Sugar from 'sugar';
import React from 'react';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { registerDynamicViews } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { DynamicViewRenderer } from '../../global.d';
import { externalNamespaces } from '../../externalNamespaceStub';

const removeContextEntities = (tweet: any, entities: any[]) => {
    let finalStr: string = tweet['_value.%'];
    entities.forEach((el) => {
        if (typeof el._key === 'string') {
            finalStr = finalStr.replace(el._key, '');
        }
    });
    return { ...tweet, '_value.%': finalStr };
};

export const Tweet: DynamicViewRenderer = ({ data, callbacks }) => {
    const twid = data.get('from_user/twitter_id')?.as('primitive');
    const nslnk = externalNamespaces.filter((el) => el.participants.includes(twid))[0]?.createLink;

    return (
        <div style={{ display: 'flex' }}>
            <div
                style={{
                    alignSelf: 'baseline',
                    marginRight: '16px',
                    marginTop: '16px',
                }}
            >
                <Badge
                    overlap="circular"
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    badgeContent={
                        <Avatar
                            style={{ height: '16px', width: '16px' }}
                            alt="Twitter"
                            src="https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png"
                        />
                    }
                >
                    <Avatar
                        src={data.get('from_user/profile_image')?.as('primitive')}
                        onClick={() => {
                            window.open(
                                `https://twitter.com/${data.get('from_user/username')?.as('primitive')}/status/${data
                                    .get('twitter_id')
                                    ?.as('primitive')}`,
                                '_blank',
                            );
                            if (callbacks?.removeFromContext && callbacks?.removeOnEnter) callbacks.removeFromContext();
                        }}
                    />
                </Badge>
            </div>

            <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" style={{ marginRight: '8px' }}>
                        <strong>{data.get('from_user/name')?.as('primitive')}</strong>
                    </Typography>
                    <Typography variant="body2" style={{ color: 'gray' }}>
                        @{data.get('from_user/username')?.as('primitive')}
                        {', '}
                        {Sugar.Date.relative(new Date(data._updatedAt || data._timestamp._updatedAt))}
                    </Typography>
                </div>

                <AutoDynamicView
                    object={removeContextEntities(
                        data.get('text')._value._value,
                        data?._value?.children?.['_value['] || [],
                    )}
                    callbacks={{ namespaceLink: nslnk }}
                    options={{ noContextMenu: true }}
                />
                <div>
                    {(data?._value?.children?.['_value['] || []).map((el: any) => {
                        const elObj = el._value._value;
                        if (elObj.type['unigraph.id'] === '$/schema/icon_url') {
                            return (
                                <div>
                                    <img
                                        src={elObj['_value.%']}
                                        style={{
                                            maxWidth: '240px',
                                            borderRadius: '8px',
                                        }}
                                        alt=""
                                    />
                                </div>
                            );
                        }
                        return (
                            <div>
                                <AutoDynamicView
                                    object={new UnigraphObject(elObj)}
                                    callbacks={{ context: data }}
                                    options={{ inline: true }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TwitterUser = ({ data, callbacks }: any) => (
    <div style={{ display: 'flex' }}>
        <div style={{ alignSelf: 'center', marginRight: '16px' }}>
            <Badge
                overlap="circular"
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                badgeContent={
                    <Avatar
                        style={{ height: '16px', width: '16px' }}
                        alt="Twitter"
                        src="https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png"
                    />
                }
            >
                <Avatar
                    src={data.get('profile_image').as('primitive')}
                    onClick={() => {
                        window.open(`https://twitter.com/${data.get('username').as('primitive')}}`, '_blank');
                    }}
                />
            </Badge>
        </div>
        <div style={{ alignSelf: 'center', marginRight: '16px' }}>
            <Typography variant="body1" style={{ marginRight: '8px' }}>
                <strong>{data.get('name').as('primitive')}</strong>
            </Typography>
            <Typography variant="body2" style={{ color: 'gray' }}>
                @{data.get('username').as('primitive')}
            </Typography>
        </div>
        <div style={{ alignSelf: 'center' }}>
            <Typography variant="body1">{data.get('description').as('primitive')}</Typography>
        </div>
    </div>
);

export const init = () => {
    registerDynamicViews({ '$/schema/tweet': { view: Tweet, options: { noSubentities: true } } });
    registerDynamicViews({ '$/schema/twitter_user': TwitterUser });
};
