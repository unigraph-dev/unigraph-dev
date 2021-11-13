import Icon from '@mdi/react'
import { mdiCubeOutline, mdiDatabaseOutline, mdiTimelineClockOutline } from '@mdi/js';
import { Typography } from '@material-ui/core';

export const ObjectOverview = ({data}: any) => {
    return <div>
        <span style={{display: 'flex', alignItems: "center"}}><Icon path={mdiCubeOutline} size={1} style={{margin: "4px"}}/><Typography>{data.uid}</Typography></span>
        <span style={{display: 'flex', alignItems: "center"}}><Icon path={mdiDatabaseOutline} size={1} style={{margin: "4px"}}/><Typography>{data.type['unigraph.id']}</Typography></span>
        <span style={{display: 'flex', alignItems: "center"}}><Icon path={mdiTimelineClockOutline} size={1} style={{margin: "4px"}}/><Typography>{new Date(data._timestamp._updatedAt).toLocaleString()}</Typography></span>
    </div>
}