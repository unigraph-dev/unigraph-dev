import { Button, List, TextField, Typography } from "@material-ui/core";
import React from "react";
import { getExecutableId } from "unigraph-dev-common/lib/api/unigraph";
import { withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { pkg as rssReaderPackage } from 'unigraph-dev-common/lib/data/unigraph.rss_reader.pkg';
import { DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";

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
        source: string
    },
    semantic_properties?: {
        children: any[]
    }
}

type ParserParam = {url: string}

const RSSFeedsBody: React.FC<{data: ARSSFeed[]}> = ({data}) => {
    const [newUrl, setNewUrl] = React.useState("");

    return <div>
        <Typography variant="body2">Here are all your RSS feeds:</Typography>
        <TextField value={newUrl} onChange={(e) => setNewUrl(e.target.value)}></TextField> 
        <DefaultObjectListView component={List} objects={data.map((el: any) => {let site = el._value.site_info._value; console.log(site); return site})} />
        <Button onClick={() => 
            window.unigraph.runExecutable(getExecutableId(rssReaderPackage, "add-feed"), {url: newUrl})
        }>Add feed</Button>
    </div>
}

export const RSSFeeds = withUnigraphSubscription(
    RSSFeedsBody,
    { schemas: [], defaultData: [], packages: [rssReaderPackage]},
    { afterSchemasLoaded: (subsId: number, setData: any) => {
        window.unigraph.subscribeToType("$/schema/rss_feed", (result: ARSSFeed[]) => {setData(result)}, subsId);
    }}
)