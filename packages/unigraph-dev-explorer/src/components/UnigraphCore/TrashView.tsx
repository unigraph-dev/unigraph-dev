import { Divider, ListItem, ListItemIcon, Typography } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import React from 'react';
import { buildGraph, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

export function TrashView() {
    const [totalDeleted, setTotalDeleted] = React.useState<any[]>([]);
    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const subsId = getRandomInt();
        tabContext.subscribeToQuery(
            '(func: type(Deleted)) {uid type { <unigraph.id> } }',
            (res: any[]) => {
                setTotalDeleted(buildGraph(res));
            },
            subsId,
            { noExpand: true },
        );

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, []);

    return (
        <DynamicObjectListView
            items={totalDeleted}
            itemRemover={(uids) => {
                window.unigraph.deleteObject(uids, true);
            }}
            compact
            defaultFilter={[]}
            context={{ uid: 'Trash' }}
        />
    );
}
