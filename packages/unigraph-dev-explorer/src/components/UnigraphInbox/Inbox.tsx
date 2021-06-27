import React from "react";
import { useEffectOnce } from "react-use"
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";
import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView";



export const Inbox = () => {

    const [inbox, setInbox] = React.useState<any[]>([]);
    const [inboxEntity, setInboxEntity] = React.useState<any>({});
    const [listUid, setListUid] = React.useState("");

    

    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToObject("$/entity/inbox", (inbox: any) => {
            const children = inbox?.['_value']?.children?.['_value[']
            if (children) {
                setListUid(inbox?.['_value']?.children?.uid);
                children.sort(byElementIndex);
                setInbox(children); 
            } else {
                setInbox([]);
            };
            setInboxEntity(inbox);
        }, id);

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <DynamicObjectListView items={inbox} context={inboxEntity} listUid={listUid} />

}