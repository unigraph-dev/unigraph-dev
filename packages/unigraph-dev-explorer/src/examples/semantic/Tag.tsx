
import { Chip } from "@material-ui/core";
import { LocalOffer } from '@material-ui/icons';
import { getContrast, NavigationContext } from '../../utils';
import { DynamicViewRenderer } from '../../global';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { registerDynamicViews } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';

import Icon from '@mdi/react'
import { mdiTagOutline } from '@mdi/js';

export const Tag: DynamicViewRenderer = ({data, callbacks}) => {
    let tag = data;
    let uid = data.uid
    if (data['_value']) tag = unpad(data);
    const bgc = (tag?.color?.startsWith && tag.color.startsWith('#')) ? tag.color : "unset";
    return <NavigationContext.Consumer>
        {(navigator) => <Chip
            size="small"
            icon={<Icon path={mdiTagOutline} size={0.75} style={{filter: (bgc === "unset" || getContrast(bgc) === "black") ? "unset" : "invert(1)"}}/>}
            style={{
                backgroundColor: bgc,
                color: bgc.startsWith("#") ? getContrast(bgc) : "unset"
            }}
            variant={"outlined"}
            label={tag.name}
            onClick={() => {
                //console.log(data)
                navigator(`/library/object?uid=${uid}`)
            }}
        />}
    </NavigationContext.Consumer>
}

export const SemanticProperties = ({data}: any) => {
    //console.log(data);

    return (data?.['_value']?.['children']?.['_value[']) ? (data?.['_value']?.['children']?.['_value['].map((el: any) => {
        return <AutoDynamicView object={unpad(el['_value'])} />
    })) : []
}


registerDynamicViews({"$/schema/tag": Tag})