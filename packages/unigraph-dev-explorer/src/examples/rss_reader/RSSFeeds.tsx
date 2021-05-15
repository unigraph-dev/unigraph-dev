import { Avatar, Button, Divider, List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from "@material-ui/core";
import React from "react";
import { getExecutableId } from "unigraph-dev-common/lib/api/unigraph";
import { registerDynamicViews, withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { pkg as rssReaderPackage } from 'unigraph-dev-common/lib/data/unigraph.rss_reader.pkg';
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView, DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";
import { DynamicViewRenderer } from "../../global";
import * as timeago from 'timeago.js';

export type ARSSFeed = {
    uid?: string,
    feed_url: string,
    site_info: {
        uid?: string,
        name: string,
        url: string,
        favicon: string,
        semantic_properties?: {
            children: any[]
        },
        creative_work?: {
            text?: string,
            abstract?: string,
            author?: string
        }
    }
}

export type ARSSItem = {
    uid?: string,
    feed: ARSSFeed,
    content: {
        uid?: string
        text: string,
        abstract: string,
        author: string
    },
    item_data: {
        uid?: string,
        name: string,
        url: string,
        favicon: string,
        source: string,
        date_created: string
    },
    semantic_properties?: {
        children: any[]
    }
    _timestamp?: {
        _updatedAt: any
    }
}

type ParserParam = {url: string}

const RSSItem: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: ARSSItem = unpad(data);

    return <React.Fragment>
        <ListItemIcon>
            <Avatar alt={"favicon of "+unpadded.feed?.site_info?.name} src={unpadded.item_data?.favicon}>{unpadded.feed?.site_info?.name}</Avatar>
        </ListItemIcon>
        <ListItemText
            primary={<a href={unpadded.item_data?.url}>{unpadded.item_data?.name}</a>}
            secondary={`Added: ${timeago.format(new Date(unpadded?.item_data?.date_created))}, updated: ${timeago.format(new Date(unpadded?._timestamp?._updatedAt))}`} 
        />
    </React.Fragment>
}

const RSSFeed: DynamicViewRenderer = ({data, callbacks}) => {
    return <React.Fragment>
        {JSON.stringify(unpad(data))}
    </React.Fragment>
}

const dynamicComponents = {
    "$/schema/rss_item": RSSItem,
    "$/schema/rss_feed": RSSFeed
}

registerDynamicViews(dynamicComponents);

const RSSFeedsBody: React.FC<{data: ARSSFeed[]}> = ({data}) => {
    const [newUrl, setNewUrl] = React.useState("");

    return <div>
        <Typography variant="body2">Here are all your RSS feeds:</Typography> 
        <DefaultObjectListView component={List} objects={data.map((el: any) => {let site = el._value.site_info._value; return site})} />
        <TextField value={newUrl} onChange={(e) => setNewUrl(e.target.value)}></TextField>
        <Button onClick={() => 
            window.unigraph.runExecutable<ParserParam>(getExecutableId(rssReaderPackage, "add-feed"), {url: newUrl})
        }>Add feed</Button>
        <Divider/>
    </div>
}

export const RSSFeedsList = withUnigraphSubscription(
    RSSFeedsBody,
    { schemas: [], defaultData: [], packages: [rssReaderPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/rss_feed", (result: ARSSFeed[]) => {setData(result)}, subsId);
    }}
)

const RSSItemsListBody: React.FC<{data: ARSSItem[]}> = ({data}) => {

    return <div>
        <List>
            {data.map(it => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </List>
    </div>
}

export const RSSItemsList = withUnigraphSubscription(
    RSSItemsListBody,
    { schemas: [], defaultData: [], packages: [rssReaderPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/rss_item", (result: ARSSItem[]) => {setData(result.reverse())}, subsId);
    }}
)

export const RSSFeeds = () => <React.Fragment>
    <RSSFeedsList/>
    <RSSItemsList/>
</React.Fragment> 