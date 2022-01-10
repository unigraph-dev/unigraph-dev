import { Avatar, Typography } from '@material-ui/core';
import React from 'react';
import { buildGraph, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import Sugar from 'sugar';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { TabContext } from '../../utils';

export function CalendarEvent({ data, callbacks }: any) {
    return (
        <div style={{ display: 'flex' }}>
            <div style={{ alignSelf: 'center', marginRight: '16px' }}>
                <Avatar
                    style={{
                        width: 16,
                        height: 16,
                        backgroundColor: data.get('calendar/color')?.as?.('primitive'),
                    }}
                >
                    {' '}
                </Avatar>
            </div>

            <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" style={{ marginRight: '8px' }}>
                        <strong>{data.get('name').as('primitive')}</strong>
                    </Typography>
                    <Typography variant="body2" style={{ color: 'gray' }}>
                        {data.get('location').as('primitive')}
                    </Typography>
                </div>
                <AutoDynamicView
                    object={new UnigraphObject(data.get('time_frame')._value)}
                    callbacks={callbacks}
                    noDrag
                    noDrop
                    inline
                />
                <div
                    style={{
                        display: data?._value?.children?.['_value[']?.map ? '' : 'none',
                        marginTop: '4px',
                    }}
                >
                    {data?._value?.children?.['_value[']?.map
                        ? data._value.children['_value['].map((it: any) => (
                              <AutoDynamicView
                                  object={new UnigraphObject(it._value)}
                                  callbacks={callbacks}
                                  inline
                                  style={{ verticalAlign: 'middle' }}
                              />
                          ))
                        : []}
                </div>
            </div>
        </div>
    );
}

export function TimeFrame({ data, callbacks }: any) {
    return (
        <span>
            {callbacks?.noDate ? '' : `${Sugar.Date.medium(new Date(data.get('start/datetime').as('primitive')))}, `}
            {`${Sugar.Date.format(new Date(data.get('start/datetime').as('primitive')), '{h}:{mm}%P')} - `}
            {Sugar.Date.format(new Date(data.get('end/datetime').as('primitive')), '{h}:{mm}%P')}
        </span>
    );
}

export function Calendar() {
    const [currentEvents, setCurrentEvents] = React.useState<any>([]);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const id = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/calendar_event',
            (res: any) => {
                setCurrentEvents(res.reverse());
            },
            id,
            { uidsOnly: true },
        );

        return function cleanup() {
            tabContext.unsubscribe(id);
        };
    }, []);

    return <DynamicObjectListView items={currentEvents} context={null} />;
}
