import { AutoDynamicViewDetailed } from "../ObjectView/AutoDynamicViewDetailed";

export const Inbox = () => {

    return <AutoDynamicViewDetailed object={{
        uid: window.unigraph.getNamespaceMap?.()?.['$/entity/inbox']?.['uid'],
        _stub: true,
        type: { "unigraph.id": "$/schema/list" }
    }} attributes={{virtualized: true}}/>

}