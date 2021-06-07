import { Avatar, Grid, Typography } from "@material-ui/core"
import { Apps, Bookmarks, Email, Inbox, PlaylistAddCheck, RssFeed, Search } from "@material-ui/icons"
import React from "react"
import { NavigationContext } from "../../utils"

export const AppLibraryWidget = ({}) => {
    return <div>
        <Typography variant="h5">Recommended Apps</Typography>
        <NavigationContext.Consumer>
        { (navigator: any) => <Grid container>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/search')}>
                <Avatar><Search/></Avatar>
                Search
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/examples/todo')}>
                <Avatar><PlaylistAddCheck></PlaylistAddCheck></Avatar>
                Todo List
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/notes-list')}>
                <Avatar><PlaylistAddCheck></PlaylistAddCheck></Avatar>
                Notes
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/examples/bookmarks')}>
                <Avatar><Bookmarks/></Avatar>
                Bookmarks
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/examples/rss_reader')}>
                <Avatar><RssFeed/></Avatar>
                RSS Reader
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/inbox')}>
                <Avatar><Inbox/></Avatar>
                Inbox
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/email')}>
                <Avatar><Email/></Avatar>
                Email
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", padding: "16px"}}
                onClick={() =>navigator('/app-library')}>
                <Avatar><Apps/></Avatar>
                All Apps
            </div>
        </Grid>
        }</NavigationContext.Consumer>
    </div>

}