import { Divider, ListItem, ListItemIcon, Typography } from "@material-ui/core"
import { Delete } from "@material-ui/icons";
import React from "react";
import { buildGraph, getRandomInt } from "unigraph-dev-common/lib/utils/utils";
import { AutoDynamicView } from "../ObjectView/AutoDynamicView";

export const TrashView = () => {

    const [totalDeleted, setTotalDeleted] = React.useState<any[]>([]);

    React.useEffect(() => {
        const subsId = getRandomInt();
        window.unigraph.subscribeToQuery(`(func: type(Deleted)) @recurse {uid expand(_userpredicate_) <unigraph.id>}`, (res: any[]) => {
            setTotalDeleted(buildGraph(res));
        }, subsId, true);

        return function cleanup () {
            window.unigraph.unsubscribe(subsId);
        }
    }, [])

    return <div>
        <Typography variant="h4" gutterBottom>Trash</Typography>
        <Typography>Items here will be deleted after 30 days. (WIP)</Typography>
        {totalDeleted.map(el => <ListItem key={el?.uid}>
            <ListItemIcon onClick={() => window.unigraph.deleteObject(el?.uid, true)}><Delete></Delete></ListItemIcon>
            <AutoDynamicView object={el} />
            <Divider/>
        </ListItem>)}
    </div>
}