import React from 'react';
import { Chip } from "@material-ui/core";
import { LocalOffer } from '@material-ui/icons';
import { getContrast, NavigationContext } from '../../utils';
import { DynamicViewRenderer } from '../../global';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { registerDynamicViews } from 'unigraph-dev-common/lib/api/unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/DefaultObjectView';

export const Tag: DynamicViewRenderer = ({data, callbacks}) => {
    if (data['_value']) data = unpad(data);
    const tag = data;
    const bgc = (tag?.color?.startsWith && tag.color.startsWith('#')) ? tag.color : "unset";
    return <NavigationContext.Consumer>
        {(navigator) => <Chip
            size="small"
            icon={<LocalOffer/>}
            style={{
                backgroundColor: bgc,
                color: bgc.startsWith("#") ? getContrast(bgc) : "unset"
            }}
            variant={"outlined"}
            label={tag.name}
            onClick={() => {
                navigator(`/semantic/tagresults?name=${tag.name}`)
            }}
        />}
    </NavigationContext.Consumer>
}

export const SemanticProperties = ({data}: any) => {
    console.log(data);

    return (data?.['_value']?.['children']?.['_value[']) ? (data?.['_value']?.['children']?.['_value['].map((el: any) => {
        return <AutoDynamicView object={unpad(el['_value'])} />
    })) : []
}


registerDynamicViews({"$/schema/tag": Tag, "$/schema/semantic_properties": SemanticProperties})