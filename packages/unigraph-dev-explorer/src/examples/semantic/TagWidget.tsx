import { Typography } from '@material-ui/core';
import React from 'react';
import { withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { NavigationContext } from '../../utils';

function TagList({ data }: any) {
    return (
        <div>
            {data.map((el: any) => (
                <AutoDynamicView inline object={el} />
            ))}
        </div>
    );
}

export const TagListSubscription = withUnigraphSubscription(
    TagList,
    { schemas: [], defaultData: [], packages: [] },
    {
        afterSchemasLoaded: (subsId: any, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType('$/schema/tag', (result: any) => {
                setData(result);
            });
        },
    },
);

export const TagWidget: React.FC = () => (
    <div>
        <Typography variant="h5" gutterBottom>
            Tags
        </Typography>
        <Typography variant="body2" gutterBottom>
            Quickly navigate to all items with a tag by clicking, or drag tag onto items to assign it
        </Typography>
        <TagListSubscription />
    </div>
);
