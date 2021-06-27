import React from "react";
import { useEffectOnce } from "react-use";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";
import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView";

export const Focus = () => {
    const [focus, setFocus] = React.useState<any[]>([]);
    const [focusEntity, setFocusEntity] = React.useState<any>({});
    const [listUid, setListUid] = React.useState("");

    

    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToObject("$/entity/focus", (entity: any) => {
            const children = entity?.['_value']?.children?.['_value[']
            if (children) {
                setListUid(entity?.['_value']?.children?.uid);
                children.sort(byElementIndex);
                setFocus(children); 
            } else {
                setFocus([]);
            };
            setFocusEntity(entity);
        }, id);

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <DynamicObjectListView items={focus} context={focusEntity} listUid={listUid} />
}