import { Avatar, Grid, Typography } from "@material-ui/core"
import { Apps, Bookmarks, CalendarToday, CodeRounded, Email, Inbox, Note, PlaylistAddCheck, RssFeed, Search, Timer } from "@material-ui/icons"
import { NavigationContext } from "../../utils"

type AppShortcutProps = {avatar: React.ReactElement<any>, address: string, text: string}

export const AppShortcut = ({avatar, address, text}: AppShortcutProps) => {
    return <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
        onClick={() => window.wsnavigator(address)}>
        <Avatar>{avatar}</Avatar>
        {text}
    </div>
}

export const AppLibraryWidget = ({}) => {
    return <div>
        <Typography variant="h5">Recommended Apps</Typography>
        <NavigationContext.Consumer>
        { (navigator: any) => <Grid container>
            <AppShortcut avatar={<Timer/>} address="/today" text="Today" />
            <AppShortcut avatar={<Search/>} address="/search" text="Search" />
            <AppShortcut avatar={<PlaylistAddCheck/>} address="/examples/todo" text="Todo List" />
            <AppShortcut avatar={<Note/>} address="/notes-list" text="Notes" />
            <AppShortcut avatar={<Bookmarks/>} address="/examples/bookmarks" text="Bookmarks" />
            <AppShortcut avatar={<RssFeed/>} address="/examples/rss_reader" text="RSS Reader" />
            <AppShortcut avatar={<Inbox/>} address="/inbox" text="Inbox" />
            <AppShortcut avatar={<Email/>} address="/email" text="Email" />
            <AppShortcut avatar={<CalendarToday/>} address="/current-events" text="Current Events" />
            <AppShortcut avatar={<CalendarToday/>} address="/calendar" text="Calendar" />
            <AppShortcut avatar={<Apps/>} address="/app-library" text="All Apps" />
        </Grid>
        }</NavigationContext.Consumer>
    </div>

}