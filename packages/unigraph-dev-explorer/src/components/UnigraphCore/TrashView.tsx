import { Divider, ListItem, ListItemIcon, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

export function TrashView() {
    const [totalDeleted, setTotalDeleted] = React.useState<any[]>([]);
    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const subsId = getRandomInt();
        tabContext.subscribeToQuery(
            '(func: type(Deleted)) {uid type { <unigraph.id> } _hide }',
            (res: any[]) => {
                setTotalDeleted(res);
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
            context={{ uid: 'Trash' }}
        />
    );
}
