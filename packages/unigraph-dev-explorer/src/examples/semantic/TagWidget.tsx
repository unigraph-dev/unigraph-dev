import { Typography } from "@material-ui/core"
import React from "react"
import { withUnigraphSubscription } from "../../unigraph-react"
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";
import { NavigationContext } from "../../utils";

function TagList ({data}: any) {
    return <div>
        <NavigationContext.Consumer>
        {(navigator: any) => data.map((el: any) => <AutoDynamicView inline object={el}/>)}
        </NavigationContext.Consumer>
    </div>
}

export const TagListSubscription = withUnigraphSubscription(
    // @ts-ignore
    TagList, {schemas: [], defaultData: [], packages: []}, {afterSchemasLoaded: (subsId, data, setData) => {
        window.unigraph.subscribeToType('$/schema/tag', (result: any) => {setData(result)})
    }}
)

export const TagWidget: React.FC = () => {
    return <div>
        <Typography variant="h5" gutterBottom >Tags</Typography>
        <Typography variant="body2" gutterBottom>Quickly navigate to all items with a tag by clicking, or drag tag onto items to assign it</Typography>
        <TagListSubscription />
    </div>
}