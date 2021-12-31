import {
    Divider, ListItem, ListItemIcon, Typography,
} from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import React from 'react';
import { buildGraph, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';

export function TrashView() {
    const [totalDeleted, setTotalDeleted] = React.useState<any[]>([]);
    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const subsId = getRandomInt();
        tabContext.subscribeToQuery('(func: type(Deleted)) @recurse {uid expand(_userpredicate_) <unigraph.id>}', (res: any[]) => {
            setTotalDeleted(buildGraph(res));
        }, subsId, { noExpand: true });

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, []);

    return (
        <div>
            <Typography variant="h4" gutterBottom>Trash</Typography>
            <Typography>Items here will be deleted after 30 days. (WIP)</Typography>
            {totalDeleted.map((el) => (
                <ListItem key={el?.uid}>
                    <ListItemIcon onClick={() => window.unigraph.deleteObject(el?.uid, true)}><Delete /></ListItemIcon>
                    <AutoDynamicView object={el} />
                    <Divider />
                </ListItem>
            ))}
        </div>
    );
}
