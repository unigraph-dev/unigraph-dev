import { Card, Chip, Typography } from "@material-ui/core"
import { LocalOffer } from "@material-ui/icons";
import React from "react"
import { withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";
import { getContrast, NavigationContext } from "../../utils";
import { Tag } from "./Tag";

function TagList ({data}: any) {
    return <div>
        <NavigationContext.Consumer>
        {(navigator: any) => data.map((el: any) => <AutoDynamicView object={unpad(el)}/>)}
        </NavigationContext.Consumer>
    </div>
}

const TagListSubscription = withUnigraphSubscription(
    // @ts-ignore
    TagList, {schemas: [], defaultData: [], packages: []}, {afterSchemasLoaded: (subsId, data, setData) => {
        window.unigraph.subscribeToType('$/schema/tag', (result: any) => {setData(result)})
    }}
)

export const TagWidget: React.FC = ({}) => {
    return <div>
        <Typography variant="h5" gutterBottom >Tags</Typography>
        <Typography variant="body2" gutterBottom>Quickly navigate to all items with a tag by clicking, or drag tag onto items to assign it</Typography>
        <TagListSubscription />
    </div>
}