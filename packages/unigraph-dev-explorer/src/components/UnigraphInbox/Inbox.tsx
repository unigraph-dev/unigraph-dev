import { ListItem, ListItemIcon, Typography } from "@material-ui/core";
import { ClearAll } from "@material-ui/icons";
import React from "react";
import { useEffectOnce } from "react-use"
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";

export const Inbox = () => {

    const [inbox, setInbox] = React.useState<any[]>([]);

    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToObject("$/entity/inbox", (inbox: any) => {
            const children = inbox?.['_value']?.children?.['_value[']
            children.sort(byElementIndex)
            if (children) {setInbox(children); } else setInbox([]);
        }, id);

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <div>
        {inbox.map(el => {
            return <React.Fragment>
                <ListItem>
                    <ListItemIcon onClick={() => window.unigraph.runExecutable("$/package/unigraph.core/0.0.1/executable/delete-item-from-list", {
                        where: "$/entity/inbox",
                        item: el['uid']
                    })} ><ClearAll/></ListItemIcon>
                    <AutoDynamicView object={el['_value']} />
                </ListItem>
            </React.Fragment>
        })}
    </div>

}