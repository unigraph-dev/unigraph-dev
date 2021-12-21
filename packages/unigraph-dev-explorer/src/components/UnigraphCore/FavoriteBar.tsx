import React from "react";
import { useEffectOnce } from "react-use";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView";

export const FavoriteBar = () => {

    const [fav, setFav] = React.useState<any[]>([]);
    const [favEntity, setFavEntity] = React.useState<any>({});
    const favState = window.unigraph.addState('favorites', [])
    
    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToObject("$/entity/favorite_bar", (fav: any) => {
            const children = fav?.['_value']?.children?.['_value[']
            if (children) {
                children.sort(byElementIndex)
                setFav(children); 
                favState.setValue(children.map((el: any) => {let unpadded = unpad(el); return {name: unpadded.name, component: unpadded.view, config: JSON.parse(unpadded.props).config}}))
            };
            setFavEntity(fav);
        }, id);

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <React.Fragment>
        <DynamicObjectListView 
            items={fav}
            context={favEntity}
            listUid={favEntity?.['_value']?.children?.uid}
            itemGetter={(el: any) => el['_value']['_value']}
            noBar noRemover
            defaultFilter={['no-deleted', 'no-noview']}
            itemRemover={(uids) => {window.unigraph.deleteItemFromArray(favEntity?.['_value']?.children?.uid, uids, favEntity.uid)}}
        />
    </React.Fragment>

}