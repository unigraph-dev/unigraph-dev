import { ListItem, ListItemText } from "@material-ui/core";
import React from "react";
import { useEffectOnce } from "react-use";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { registerDynamicViews } from "../../unigraph-react";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { DynamicViewRenderer } from "../../global";
import { AutoDynamicView } from "../ObjectView/AutoDynamicView";

const ViewItem: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: any = unpad(data);

    return <React.Fragment>
        <div onClick={() => window.newTab(window.layoutModel, {
            type: 'tab',
            config: JSON.parse(unpadded.props).config,
            name: unpadded.name,
            component: unpadded.view,
            enableFloat: 'true'
        })} style={{display: "contents"}}>
            <ListItemText primary={unpadded.name}></ListItemText>
        </div>
    </React.Fragment>
}

registerDynamicViews({"$/schema/view": ViewItem})

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
        {fav.map((el, index) => <ListItem>
            <AutoDynamicView object={el['_value']['_value']} callbacks={{context: favEntity, removeFromContext: () => window.unigraph.deleteItemFromArray(favEntity?.['_value']?.children?.uid, index)}}/>
        </ListItem>)}
    </React.Fragment>

}