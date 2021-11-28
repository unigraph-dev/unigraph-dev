import { Avatar, Grid, Typography } from "@material-ui/core"
import { Apps, Bookmarks, CalendarToday, CodeRounded, Email, Inbox, Note, PlaylistAddCheck, RssFeed, Search, Timer } from "@material-ui/icons"
import { NavigationContext } from "../../utils"

import Icon from '@mdi/react'
import { mdiViewDashboardOutline, mdiFeatureSearchOutline, mdiRss, mdiAppsBox, mdiEmailOpenMultipleOutline, mdiCalendarOutline, mdiCalendarClockOutline, mdiInboxOutline, mdiBookmarkMultipleOutline, mdiCheckboxMarkedCirclePlusOutline, mdiNoteMultipleOutline, mdiTrello } from '@mdi/js';

type AppShortcutProps = {avatar: React.ReactElement<any>, address: string, text: string}

export const AppShortcut = ({avatar, address, text}: AppShortcutProps) => {
    return <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
        onClick={() => window.wsnavigator(address)}>
        {avatar}
        {text}
    </div>
}

export const AllApps = () => {
    return <Grid container spacing={2}>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiViewDashboardOutline} size={1}/>} address="/today" text="Today" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiFeatureSearchOutline} size={1}/>} address="/search" text="Search" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiCheckboxMarkedCirclePlusOutline} size={1}/>} address="/examples/todo" text="Todo List" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiNoteMultipleOutline} size={1}/>} address="/notes-list" text="Notes" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiBookmarkMultipleOutline} size={1}/>} address="/examples/bookmarks" text="Bookmarks" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiRss} size={1}/>} address="/examples/rss_reader" text="RSS Reader" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiInboxOutline} size={1}/>} address="/inbox" text="Inbox" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiEmailOpenMultipleOutline} size={1}/>} address="/email" text="Email" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiCalendarClockOutline} size={1}/>} address="/current-events" text="Current Events" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiCalendarOutline} size={1}/>} address="/calendar" text="Calendar" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiTrello} size={1}/>} address="/$/executable/kanban-list-view" text="Kanban" />
        </Grid>
        <Grid item xs={3}>
        <AppShortcut avatar={<Icon path={mdiAppsBox} size={1}/>} address="/app-library" text="All Apps" />
        </Grid>
    </Grid>
}

export const AppLibraryWidget = ({}) => {
    return <div style={{overflowY: "auto", height: "100%"}}>
        <Typography variant="h5">Recommended Apps</Typography>
        <AllApps />
    </div>

}