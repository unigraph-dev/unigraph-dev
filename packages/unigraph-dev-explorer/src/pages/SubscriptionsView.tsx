import { Card, Typography } from '@material-ui/core';
import React from 'react';
import Sugar from 'sugar';
import { AutoDynamicView } from '../components/ObjectView/AutoDynamicView';

function Column({ name, children }: any) {
    return (
        <div style={{ display: 'flex' }}>
            <Typography style={{ color: 'gray', marginRight: '4px' }}>{name}</Typography>
            {children}
        </div>
    );
}

export function SubscriptionsView() {
    const [subs, setSubs] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fn = () => {
            window.unigraph.getSubscriptions?.().then((newSubs: any[]) => {
                setSubs(newSubs);
            });
        };
        const interval = setInterval(fn, 5000, {});
        fn();

        return function cleanup() {
            clearInterval(interval);
        };
    }, []);

    return (
        <div>
            <Typography>
                {subs.length}
                {' Subscriptions, '}
                {subs.filter((el: any) => el?.hibernated !== true).length}
                {' active'}
            </Typography>
            {subs.map((el) => (
                <Card style={{ margin: '12px', padding: '12px' }} variant="outlined">
                    <Column name="ID">
                        <Typography>{el.id}</Typography>
                    </Column>
                    <Column name="Results length">
                        <Typography>{el.data.length}</Typography>
                    </Column>
                    <Column name="Query time (ms)">
                        <Typography>{el.queryTime}</Typography>
                    </Column>
                    <Column name="Result type example">
                        <Typography>{el.data[0]?.type?.['unigraph.id'] || 'No type'}</Typography>
                    </Column>
                    <Column name="Started at">
                        <Typography>{Sugar.Date.relative(new Date(el.regTime))}</Typography>
                    </Column>
                    <Column name="Subscription type">
                        <Typography>{el.subType}</Typography>
                    </Column>
                    <Column name="From connection / client">
                        <Typography>
                            {el.connId} / {el.clientId}
                        </Typography>
                    </Column>
                    <Column name="Hibernated">
                        <Typography>{el.hibernated === true ? 'Yes' : 'No'}</Typography>
                    </Column>
                </Card>
            ))}
        </div>
    );
}
