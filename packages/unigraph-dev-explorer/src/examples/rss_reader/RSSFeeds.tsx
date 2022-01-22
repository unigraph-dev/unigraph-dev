import {
    Avatar,
    Badge,
    Button,
    Divider,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography,
} from '@material-ui/core';
import React from 'react';
import { getExecutableId, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { pkg as rssReaderPackage } from 'unigraph-dev-common/lib/data/unigraph.rss_reader.pkg';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { Description, Link, OpenInBrowserOutlined } from '@material-ui/icons';
import Sugar from 'sugar';
import InfiniteScroll from 'react-infinite-scroll-component';
import Icon from '@mdi/react';
import { mdiRssBox } from '@mdi/js';
import { registerDynamicViews, registerDetailedDynamicViews, withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { DynamicViewRenderer } from '../../global.d';
import { download, upload, getComponentFromPage, TabContext, timeSince } from '../../utils';
import { Html } from '../semantic/Html';
import { setupInfiniteScrolling } from '../../components/ObjectView/infiniteScrolling';

export type ARSSFeed = {
    uid?: string;
    feed_url: string;
    site_info: {
        uid?: string;
        name: string;
        url: string;
        favicon: string;
        children: any[];
        creative_work?: {
            text?: any;
            abstract?: any;
            author?: string;
        };
    };
};

export type ARSSItem = {
    uid?: string;
    feed: ARSSFeed;
    content: {
        uid?: string;
        text: any;
        abstract: any;
        author: string;
    };
    item_data: {
        uid?: string;
        name: string;
        url: string;
        favicon: string;
        source: string;
        date_created: string;
        creative_work?: any;
    };
    children: any[];
    _updatedAt: any;
};

type ParserParam = { url: string };

const RSSItem: DynamicViewRenderer = ({ data, callbacks }) => {
    const unpadded: ARSSItem = React.useMemo(() => unpad(data), [data]);

    return (
        <>
            <ListItemIcon>
                <Badge
                    overlap="circle"
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    badgeContent={<Icon path={mdiRssBox} size={0.75} style={{ opacity: 1 }} />}
                >
                    <Avatar alt={`favicon of ${unpadded.feed?.site_info?.name}`} src={unpadded.item_data?.favicon}>
                        {unpadded.feed?.site_info?.name}
                    </Avatar>
                </Badge>
            </ListItemIcon>
            <ListItemText
                primary={unpadded.item_data?.name}
                secondary={
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <OpenInBrowserOutlined
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    ev.preventDefault();
                                    window.open(unpadded.item_data?.url, '_blank');
                                    if (callbacks?.removeFromContext) callbacks.removeFromContext();
                                }}
                            />
                            <Link
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    ev.preventDefault();
                                    const htmlUid = data?.get('content/text')?._value?._value?.uid;
                                    if (htmlUid)
                                        window.newTab(
                                            window.layoutModel,
                                            getComponentFromPage('/library/object', {
                                                uid: htmlUid,
                                                context: data.uid,
                                                type: data?.type?.['unigraph.id'],
                                            }),
                                        );
                                    if (callbacks?.removeFromContext && callbacks?.removeOnEnter)
                                        callbacks.removeFromContext();
                                }}
                            />
                            {unpadded.item_data?.creative_work?.text ? (
                                <Description
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        ev.preventDefault();
                                        const htmlUid = data?.get('item_data/creative_work/text')?._value?._value?.uid;
                                        if (htmlUid)
                                            window.newTab(
                                                window.layoutModel,
                                                getComponentFromPage('/library/object', {
                                                    uid: htmlUid,
                                                    context: data.uid,
                                                    type: data?.type?.['unigraph.id'],
                                                }),
                                            );
                                        if (callbacks?.removeFromContext) callbacks.removeFromContext();
                                    }}
                                />
                            ) : (
                                []
                            )}
                            <div>
                                {'Added: '}
                                {(() => {
                                    try {
                                        return Sugar.Date.relative(new Date(unpadded?.item_data?.date_created));
                                    } catch (e) {
                                        return 'unknown';
                                    }
                                })()}
                                {', updated: '}
                                {(() => {
                                    try {
                                        return Sugar.Date.relative(new Date(unpadded?._updatedAt));
                                    } catch (e) {
                                        return 'unknown';
                                    }
                                })()}
                            </div>
                        </div>
                        {unpadded?.content?.abstract ? (
                            <div style={{ color: 'black' }}>{`${unpadded.content.abstract}...`}</div>
                        ) : (
                            ''
                        )}
                    </div>
                }
            />
        </>
    );
};

function RSSItemDetailed({ data, callbacks }: any) {
    return <Html context={data} data={data?.get('content/text')?._value?._value} />;
}

const RSSFeed: DynamicViewRenderer = ({ data, callbacks }) => {
    const updatedDate = data?._value?.last_updated?.['_value.%dt'] || 0;
    return (
        <div style={{ display: 'flex', width: '100%' }}>
            <div style={{ flexGrow: 1 }}>
                <AutoDynamicView object={new UnigraphObject(data?._value?.site_info?._value)} noContextMenu inline />
            </div>
            <Typography
                style={{
                    alignSelf: 'center',
                    marginRight: '6px',
                    marginLeft: '6px',
                    color: 'gray',
                }}
                variant="body2"
            >
                {updatedDate ? timeSince(new Date(updatedDate)) : 'never'}
            </Typography>
        </div>
    );
};

export const init = () => {
    const dynamicComponents = {
        '$/schema/rss_item': RSSItem,
        '$/schema/rss_feed': RSSFeed,
    };

    registerDynamicViews(dynamicComponents);
    registerDetailedDynamicViews({
        '$/schema/rss_item': { view: RSSItemDetailed },
    });
};

const RSSFeedsBody: React.FC<{ data: ARSSFeed[] }> = ({ data }) => {
    const [newUrl, setNewUrl] = React.useState('');

    return (
        <div>
            <Typography variant="body2">Here are all your RSS feeds:</Typography>
            {data.map((el) => (
                <ListItem key={el.uid}>
                    <AutoDynamicView object={el} />
                </ListItem>
            ))}
            <TextField value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            <Button
                onClick={() =>
                    window.unigraph.runExecutable<ParserParam>(getExecutableId(rssReaderPackage, 'add-feed'), {
                        url: newUrl,
                    })
                }
            >
                Add feed
            </Button>
            <Button
                onClick={() => {
                    upload((f: File) => {
                        f.text().then((text: string) => {
                            window.unigraph.runExecutable(getExecutableId(rssReaderPackage, 'import-opml'), {
                                opmlText: text,
                            });
                        });
                    });
                }}
            >
                Import from OPML
            </Button>
            <Button>Export to OPML</Button>
            <Button
                onClick={() => {
                    window.unigraph.exportObjects?.(data.map((el) => el.uid) as string[], {}).then((results: any[]) => {
                        download('feeds.json', JSON.stringify(results));
                    });
                }}
            >
                Export as entities
            </Button>
            <Divider />
        </div>
    );
};

export const RSSFeedsList = withUnigraphSubscription(
    RSSFeedsBody,
    { schemas: [], defaultData: [], packages: [rssReaderPackage] },
    {
        afterSchemasLoaded: (subsId: number, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType(
                '$/schema/rss_feed',
                (result: ARSSFeed[]) => {
                    setData(result);
                },
                subsId,
            );
        },
    },
);

const RSSItemsListBody: React.FC<any> = ({ data, viewId }) => {
    const [loadedItems, setLoadedItems] = React.useState<UnigraphObject[]>([]);
    const [setupProps, setSetupProps] = React.useState<{
        next: any;
        cleanup: any;
        onUpdate: any;
    } | null>(null);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        if (setupProps?.cleanup) setupProps.cleanup();
        let newProps: any;
        if (data.length) {
            newProps = setupInfiniteScrolling(
                data.map((el: any) => el.uid),
                10,
                (items: any[]) => {
                    setLoadedItems(items);
                },
                tabContext,
            );
            setSetupProps(newProps);
        }

        return function cleanup() {
            newProps?.cleanup();
        };
    }, [data.length === 0]);

    React.useEffect(() => {
        setupProps?.onUpdate(data.map((el: any) => el.uid));
    }, [data.map((el: any) => el.uid)]);

    return (
        <div>
            <InfiniteScroll
                dataLength={loadedItems.length} // This is important field to render the next data
                next={setupProps?.next || (() => false)}
                scrollableTarget={`workspaceContainer${viewId}`}
                hasMore={loadedItems.length < data.length}
                loader={<h4>Loading...</h4>}
                endMessage={[]}
            >
                {(loadedItems || []).map((it: any) => (
                    <ListItem button key={it.uid}>
                        <AutoDynamicView object={it} />
                    </ListItem>
                ))}
            </InfiniteScroll>
        </div>
    );
};

export const RSSItemsList: any = withUnigraphSubscription(
    RSSItemsListBody,
    { schemas: [], defaultData: [], packages: [rssReaderPackage] },
    {
        afterSchemasLoaded: (subsId: number, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType(
                '$/schema/rss_item',
                (result: ARSSItem[]) => {
                    setData(result.reverse());
                },
                subsId,
                { uidsOnly: true },
            );
        },
    },
);

export function RSSFeeds({ id }: any) {
    console.log(id);
    return (
        <div>
            <RSSFeedsList />
            <RSSItemsList viewId={id} />
        </div>
    );
}
