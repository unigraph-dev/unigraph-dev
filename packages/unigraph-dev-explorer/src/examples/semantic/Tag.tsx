import React from 'react';
import { Chip } from "@material-ui/core";
import { LocalOffer } from '@material-ui/icons';
import { getContrast, NavigationContext } from '../../utils';
import { DynamicViewRenderer } from '../../global';

export const Tag: DynamicViewRenderer = ({data, callbacks}) => {
    const tag = data;
    const bgc = tag.color?.startsWith('#') ? tag.color : "unset";
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