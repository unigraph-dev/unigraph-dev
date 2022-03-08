import { Card, List, Typography } from '@mui/material';
import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicView } from '../components/ObjectView/AutoDynamicView';
import { AutoDynamicViewDetailed } from '../components/ObjectView/AutoDynamicViewDetailed';
import { DynamicObjectListView } from '../components/ObjectView/DynamicObjectListView';
import { usePackages } from '../components/PackageManager/PackageManager';
import { TabContext } from '../utils';
import { AnalyticsItem, useAnalyticsState } from './Settings';

export default function Onboarding({ id }: any) {
    const { analyticsMode, analyticsState } = useAnalyticsState();
    const packages = usePackages();

    const tabContext = React.useContext(TabContext);

    return (
        <div>
            <Typography variant="h2">Welcome to Unigraph!</Typography>
            <Typography variant="h4">Enabled Apps</Typography>
            <Typography variant="body1">Choose which apps you want to use!</Typography>
            <DynamicObjectListView items={packages} context={null} compact style={{ height: 'auto' }} />
            <Typography variant="h4">Opt into analytics</Typography>
            <Typography variant="body1">Help us make Unigraph better!</Typography>
            <List>
                <AnalyticsItem analyticsMode={analyticsMode} analyticsState={analyticsState} />
            </List>
            <Typography variant="h4">Getting around in Unigraph</Typography>
            <Typography variant="body1">An illustrated guide to the main concepts of Unigraph</Typography>
            <AutoDynamicView
                object={{
                    uid: window.unigraph.getNamespaceMap?.()?.['$/entity/tutorial']?.uid,
                    _stub: true,
                    type: { 'unigraph.id': '$/schema/note_block' },
                }}
            />
        </div>
    );
}
