import { Typography } from '@mui/material';
import React from 'react';
import _ from 'lodash/fp';
import { withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { NavigationContext } from '../../utils';

function TagList({ data }: any) {
    return (
        <div>
            {data.map((el: any) => (
                <AutoDynamicView options={{ inline: true }} object={el} />
            ))}
        </div>
    );
}
const getLowercaseName = (a: any) => a.get('name').as('primitive').toLowerCase();

export const TagListSubscription = withUnigraphSubscription(
    TagList,
    { schemas: [], defaultData: [], packages: [] },
    {
        afterSchemasLoaded: (subsId: any, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType('$/schema/tag', _.pipe(_.sortBy(getLowercaseName), setData));
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
