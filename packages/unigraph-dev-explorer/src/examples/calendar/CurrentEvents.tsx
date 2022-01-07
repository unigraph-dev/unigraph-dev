import { Typography } from '@material-ui/core';
import React from 'react';
import {
    buildGraph,
    getRandomInt,
    UnigraphObject,
} from 'unigraph-dev-common/lib/utils/utils';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Sugar from 'sugar';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { TabContext } from '../../utils';

export function CurrentEvents() {
    const [currentEvents, setCurrentEvents] = React.useState<any>([]);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const id = getRandomInt();

        tabContext.subscribeToQuery(
            '$/executable/get-next-events',
            (res: any) => {
                setCurrentEvents(buildGraph(res as any[]));
            },
            id,
            { noExpand: true },
        );

        return function cleanup() {
            tabContext.unsubscribe(id);
        };
    }, []);

    return (
        <DynamicObjectListView
            groupBy="time_frame"
            groupers={{
                time_frame: (els: any[]) => {
                    // Group all current events into an agenda view
                    // 1. Find all timeframes and group them
                    els = buildGraph(els);
                    const groups: any = {};
                    groups[Sugar.Date.medium(new Date())] = [];
                    els.filter(
                        (el) =>
                            el.type['unigraph.id'] === '$/schema/time_frame',
                    ).forEach((el) => {
                        const dd = Sugar.Date.medium(
                            new Date(
                                new UnigraphObject(el)
                                    .get('start/datetime')
                                    .as('primitive'),
                            ),
                        );
                        if (groups[dd]) groups[dd].push(el);
                        else groups[dd] = [el];
                    });
                    // 2. Go through groups and find all entities associated with these timeframes
                    const finalGroups: any = [];
                    Object.entries(groups)
                        .sort(
                            (a, b) =>
                                Sugar.Date.create(a[0]).getTime() -
                                Sugar.Date.create(b[0]).getTime(),
                        )
                        .map(([key, value]: any) => {
                            const insert: any = { name: key, items: [] };
                            value
                                .sort(
                                    (a: any, b: any) =>
                                        Sugar.Date.create(
                                            new Date(
                                                new UnigraphObject(a)
                                                    .get('start/datetime')
                                                    .as('primitive'),
                                            ),
                                        ).getTime() -
                                        Sugar.Date.create(
                                            new Date(
                                                new UnigraphObject(b)
                                                    .get('start/datetime')
                                                    .as('primitive'),
                                            ),
                                        ).getTime(),
                                )
                                .map((val: any) => {
                                    els.filter(
                                        (el) =>
                                            el.type['unigraph.id'] !==
                                            '$/schema/time_frame',
                                    ).forEach((el) => {
                                        if (
                                            JSON.stringify(
                                                unpad(el, false),
                                            ).includes(val._value.uid)
                                        )
                                            insert.items.push(el);
                                    });
                                });
                            finalGroups.push(insert);
                        });
                    // els.map(el => console.log(JSON.stringify(unpad(el, false))))
                    return finalGroups;
                },
            }}
            items={currentEvents}
            context={null}
            callbacks={{ noDate: true }}
        />
    );
}
