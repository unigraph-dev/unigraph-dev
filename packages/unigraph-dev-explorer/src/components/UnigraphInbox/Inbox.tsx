import React from "react";
import { useEffectOnce } from "react-use"
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView, AutoDynamicViewDetailed } from "../ObjectView/DefaultObjectView";
import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView";



export const Inbox = () => {

    const [inboxEntity, setInboxEntity] = React.useState<any>({});
    const [subsId, setSubsId] = React.useState(getRandomInt);

    useEffectOnce(() => {

        window.unigraph.subscribeToObject("$/entity/inbox", (inbox: any) => {
            setInboxEntity(inbox);
        }, subsId);

        return function cleanup() {
            window.unigraph.unsubscribe(subsId);
        }
    })

    return <AutoDynamicViewDetailed object={inboxEntity} callbacks={{subsId}} attributes={{virtualized: true}}/>

}