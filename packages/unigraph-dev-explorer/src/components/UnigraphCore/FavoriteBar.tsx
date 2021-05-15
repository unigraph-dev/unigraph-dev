import { ListItem, ListItemText } from "@material-ui/core";
import React from "react";
import { useEffectOnce } from "react-use";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";

export const FavoriteBar = () => {

    const [fav, setFav] = React.useState<any[]>([]);
    
    useEffectOnce(() => {
        const id = getRandomInt();

        setTimeout(() => window.unigraph.subscribeToObject("$/entity/favorite_bar", (fav: any) => {
            const children = fav?.['_value']?.children?.['_value[']
            children.sort(byElementIndex)
            if (children) setFav(children);
        }, id), 1000)

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <React.Fragment>
        {fav.map(el => <ListItem button onClick={() => window.newTab(window.layoutModel, {
            type: 'tab',
            config: JSON.parse(el?._value?._value?.props?.["_value.%"]).config,
            name: el?._value?._value?.name?.["_value.%"],
            component: el?._value?._value?.view?.["_value.%"],
            enableFloat: 'true'
        })}>
            <ListItemText primary={el?._value?._value?.name?.["_value.%"]}/>
        </ListItem>)}
    </React.Fragment>

}