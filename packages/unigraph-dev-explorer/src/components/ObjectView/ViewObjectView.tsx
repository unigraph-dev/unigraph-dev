import { ListItemText } from '@material-ui/core';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global.d';

export const ViewItem: DynamicViewRenderer = ({ data, callbacks }) => {
    const unpadded: any = unpad(data);

    return (
        <div style={{ display: 'contents' }}>
            <ListItemText primary={unpadded.name} />
        </div>
    );
};
