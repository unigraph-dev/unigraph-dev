import { ListItem, ListItemText } from "@material-ui/core";
import React from "react";
import { useEffectOnce } from "react-use";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { DynamicViewRenderer } from "../../global";
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";

const ViewItem: DynamicViewRenderer = ({data, callbacks}) => {
    console.log(data);
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
    
    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToObject("$/entity/favorite_bar", (fav: any) => {
            const children = fav?.['_value']?.children?.['_value[']
            children.sort(byElementIndex)
            if (children) setFav(children);
        }, id);

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <React.Fragment>
        {fav.map(el => <ListItem>
            <AutoDynamicView object={el['_value']}/>
        </ListItem>)}
    </React.Fragment>

}