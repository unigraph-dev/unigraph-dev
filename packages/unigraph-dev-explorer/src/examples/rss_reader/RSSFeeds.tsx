import { Avatar, Button, Divider, List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from "@material-ui/core";
import React from "react";
import { getExecutableId, getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { registerDynamicViews, withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { pkg as rssReaderPackage } from 'unigraph-dev-common/lib/data/unigraph.rss_reader.pkg';
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView, DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";
import { DynamicViewRenderer } from "../../global";
import { download, upload } from "../../utils";
import { Description, Link } from "@material-ui/icons";
import { getComponentFromPage } from "../../Workspace";
import Sugar from "sugar";
import InfiniteScroll from 'react-infinite-scroll-component';
import _ from "lodash";

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
        date_created: string,
        creative_work?: any
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
                <div style={{display: "flex", alignItems: "center"}}><Link onClick={() => {
                    const htmlUid = data?.get('content/text')?.['_value']?.['_value']?.['uid'];
                    if (htmlUid) window.newTab(window.layoutModel, getComponentFromPage('/library/object', {uid: htmlUid, context: data.uid}));
                    if (callbacks?.removeFromContext) callbacks.removeFromContext();
                }}/>
                {unpadded.item_data?.creative_work?.text ? <Description onClick={() => {
                    const htmlUid = data?.get('item_data/creative_work/text')?.['_value']?.['_value']?.['uid'];
                    if (htmlUid) window.newTab(window.layoutModel, getComponentFromPage('/library/object', {uid: htmlUid, context: data.uid}));
                    if (callbacks?.removeFromContext) callbacks.removeFromContext();
                }}/> : []}
                <div>Added: {Sugar.Date.relative(new Date(unpadded?.item_data?.date_created))}, updated: {Sugar.Date.relative(new Date(unpadded?._timestamp?._updatedAt))}</div></div>
                {unpadded?.content?.abstract ? <div style={{color: 'black'}}>{unpadded.content.abstract+"..."}</div> : ''}
            </div>} 
        />
    </React.Fragment>
}

const RSSFeed: DynamicViewRenderer = ({data, callbacks}) => {
    return <AutoDynamicView object={data?.['_value']?.['site_info']?.['_value']} noContextMenu noDrop/>
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
        <TextField value={newUrl} onChange={(e) => setNewUrl(e.target.value)}/>
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
        <Button onClick={() => {window.unigraph.exportObjects?.(data.map(el => el['uid']) as string[], {}).then((results: any[]) => {download('feeds.json', JSON.stringify(results))})}}>Export as entities</Button>
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

const RSSItemsListBody: React.FC<any> = ({data, viewId}) => {

    const [loadedItems, setLoadedItems] = React.useState<UnigraphObject[]>([]);
    const [subs, setSubs] = React.useState<any[]>([]);
    const subsRef = React.useRef<any>([]);
    const [reload, setReload] = React.useState(0);
    const [chunks, setChunks] = React.useState<any[][]>(_.chunk(data, 50));

    React.useEffect(() => { setChunks(_.chunk(data, 50)) }, [data]);

    React.useEffect(() => { 
        subsRef.current = subs;
        if (!(loadedItems.length && !subs.length)) setLoadedItems(subs.reduce((prev: any[], current: any) => {prev.push(...current.results); return prev;}, []));
    }, [subs]);

    React.useEffect(() => {
        if (reload !== 0 && subs.length === 0) {
            for(let i=0; i<reload; ++i) {
                nextGroup();
            };
            setReload(0);
        }
    }, [subs, reload])

    const setSubResult = React.useCallback((data: any[], index: number) => {
        let newSubs = [...subsRef.current];
        if (newSubs[index]) {
            newSubs[index].results = data;
            setSubs(newSubs)
        };
    }, [subs]);
    const nextGroup = () => {
        console.log("Showing next group...", subs.length)
        if (chunks[subs.length]?.length) {
            const subId = getRandomInt();
            const thisSub = {id: subId, results: [] };
            console.log(chunks[subs.length].map((el: any) => el.uid));
            window.unigraph.subscribeToObject(chunks[subs.length].map((el: any) => el.uid), (results: any[]) => {
                let resultsMap: any = {};
                results.forEach((el: any) => resultsMap[el.uid] = el);
                setSubResult(chunks[subs.length].map((el: any) => resultsMap[el.uid]), subs.length);
            }, subId, {queryAsType: "$/schema/rss_item"});
            setSubs([...subs, thisSub]);
        }
    };

    React.useEffect(() => {
        const nextGroups = subs.length || 1;
        const cleanup = () => {
            subsRef.current.forEach((el: any) => {
                window.unigraph.unsubscribe(el.id);
        })};
        cleanup();
        setSubs([]);
        setReload(nextGroups);
        return cleanup;
    }, [chunks])

    return <div>
        <InfiniteScroll
            dataLength={loadedItems.length} //This is important field to render the next data
            next={nextGroup}
            scrollableTarget={"workspaceContainer"+viewId}
            hasMore={true}
            loader={<h4>Loading...</h4>}
            endMessage={
                <p style={{ textAlign: 'center' }}>
                <b>Yay! You have seen it all</b>
                </p>
            }
        >
            {(loadedItems || []).map((it: any) => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </InfiniteScroll>
    </div>
}

export const RSSItemsList: any = withUnigraphSubscription(
    RSSItemsListBody,
    { schemas: [], defaultData: [], packages: [rssReaderPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/rss_item", (result: ARSSItem[]) => {setData(result.reverse())}, subsId, {uidsOnly: true});
    }}
)

export const RSSFeeds = ({id}: any) =>{ 
    console.log(id)
return <div>
    <RSSFeedsList/>
    <RSSItemsList viewId={id}/>
</div> }