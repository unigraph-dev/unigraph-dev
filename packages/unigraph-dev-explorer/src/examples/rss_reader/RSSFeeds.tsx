import { Avatar, Button, Divider, List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from "@material-ui/core";
import React from "react";
import { getExecutableId } from "unigraph-dev-common/lib/api/unigraph";
import { registerDynamicViews, withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { pkg as rssReaderPackage } from 'unigraph-dev-common/lib/data/unigraph.rss_reader.pkg';
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView, DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";
import { DynamicViewRenderer } from "../../global";
import * as timeago from 'timeago.js';
import { download, upload } from "../../utils";
import { Link } from "@material-ui/icons";
import { getComponentFromPage } from "../../Workspace";

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
            text?: any,
            abstract?: any,
            author?: string
        }
    }
}

export type ARSSItem = {
    uid?: string,
    feed: ARSSFeed,
    content: {
        uid?: string
        text: any,
        abstract: any,
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
            secondary={<div>
                <Link onClick={() => {
                    const htmlUid = data?.['_value']?.['content']?.['_value']?.['_value']?.['text']?.['_value']?.['_value']?.['uid']; 
                    if (htmlUid) window.newTab(window.layoutModel, getComponentFromPage('/library/object', {uid: htmlUid}));
                    if (callbacks?.['delete-from-inbox']) callbacks['delete-from-inbox']();
                }}></Link>
                <div>Added: {timeago.format(new Date(unpadded?.item_data?.date_created))}, updated: {timeago.format(new Date(unpadded?._timestamp?._updatedAt))}</div>
                {unpadded?.content?.abstract ? <div style={{color: 'black'}}>{unpadded.content.abstract+"..."}</div> : ''}
            </div>} 
        />
    </React.Fragment>
}

const RSSFeed: DynamicViewRenderer = ({data, callbacks}) => {
    return <AutoDynamicView object={data?.['_value']?.['site_info']?.['_value']}/>
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
        {data.map(el => <ListItem key={el.uid}><AutoDynamicView object={el}/></ListItem>)}
        <TextField value={newUrl} onChange={(e) => setNewUrl(e.target.value)}></TextField>
        <Button onClick={() => 
            window.unigraph.runExecutable<ParserParam>(getExecutableId(rssReaderPackage, "add-feed"), {url: newUrl})
        }>Add feed</Button>
        <Button onClick={() => {
            upload((f: File) => {
                f.text().then((text: string) => {
                    window.unigraph.runExecutable(getExecutableId(rssReaderPackage, "import-opml"), {opmlText: text});
                })
            })
        }}>Import from OPML</Button>
        <Button>Export to OPML</Button>
        <Button onClick={() => {download('feeds.json', JSON.stringify(data, null, 4))}}>Export as entities</Button>
        <Divider/>
    </div>
}

export const RSSFeedsList = withUnigraphSubscription(
    RSSFeedsBody,
    { schemas: [], defaultData: Array(10).fill({'type': {'unigraph.id': '$/skeleton/default'}}), packages: [rssReaderPackage]},
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
    { schemas: [], defaultData: Array(10).fill({'type': {'unigraph.id': '$/skeleton/default'}}), packages: [rssReaderPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/rss_item", (result: ARSSItem[]) => {setData(result.reverse())}, subsId);
    }}
)

export const RSSFeeds = () => <React.Fragment>
    <RSSFeedsList/>
    <RSSItemsList/>
</React.Fragment> 