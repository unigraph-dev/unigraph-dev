const Innertube = require('youtubei.js');
const Sugar = require('sugar');

const youtube = await new Innertube();

const accounts = (
    await unigraph.getQueries([
        `(func: uid(accUid)) {
    uid
    _youtubeiCredentials
    _youtubeiPending
    _youtubeiLastFeedId
}
accUid as var(func: uid(parAcc)) @filter((NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @cascade {
    type @filter(eq(<unigraph.id>, "$/schema/internet_account")) {<unigraph.id>}
    _value {
        site {
            _value {
                _value {
                    name @filter(eq(<_value.%>, "Google")) {
                        <_value.%>
                    }
                }
            }   
        }
    }
}
var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
    <~type> { parAcc as uid }
}`,
    ])
)[0];

if (!accounts[0]?.uid || accounts?.length !== 1 || !(accounts[0]?._youtubeiCredentials?.length >= 20)) {
    console.log(accounts);
    return;
} // Must have one Google account for this to work.
// TODO: handle multiple accounts

let creds;

try {
    creds = JSON.parse(accounts[0]?._youtubeiCredentials || '');
} catch (e) {
    creds = {};
}

youtube.ev.on('auth', (data) => {
    // eslint-disable-next-line default-case
    switch (data.status) {
        case 'SUCCESS':
            console.log('Successfully signed in, enjoy!');
            break;
    }
});

youtube.ev.on('update-credentials', (data) => {
    unigraph.updateObject(
        accounts[0].uid,
        {
            _youtubeiCredentials: JSON.stringify(data.credentials),
        },
        false,
        false,
    );
    console.log('Credentials updated!', data);
});

await youtube.signIn(creds);

const subsFeed = await youtube.actions.browse('FEsubscriptions');
const videos =
    subsFeed.data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents
        .filter((el) => el.itemSectionRenderer)
        .map((el) => el.itemSectionRenderer.contents[0].shelfRenderer.content.gridRenderer.items)
        .flat()
        .filter((el) => el.gridVideoRenderer)
        .map((item) => ({
            id: item.gridVideoRenderer.videoId,
            title: item?.gridVideoRenderer?.title?.runs?.map((run) => run.text).join(' '),
            channel: {
                id: item?.gridVideoRenderer?.shortBylineText?.runs[0]?.navigationEndpoint?.browseEndpoint?.browseId,
                thumbnail: item?.gridVideoRenderer?.channelThumbnail?.thumbnails?.[0],
                name: item?.gridVideoRenderer?.shortBylineText?.runs[0]?.text || 'N/A',
                url: `https://www.youtube.com${item?.gridVideoRenderer?.shortBylineText?.runs[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl}`,
            },
            metadata: {
                duration: item?.gridVideoRenderer?.thumbnailOverlays?.filter(
                    (el) => el.thumbnailOverlayTimeStatusRenderer,
                )?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText,
                view_count: item?.gridVideoRenderer?.viewCountText?.simpleText || 'N/A',
                thumbnail: item?.gridVideoRenderer?.thumbnail?.thumbnails.slice(-1)[0] || [],
                moving_thumbnail:
                    item?.gridVideoRenderer?.richThumbnail?.movingThumbnailRenderer?.movingThumbnailDetails
                        ?.thumbnails[0] || {},
                published: item?.gridVideoRenderer?.publishedTimeText?.simpleText || 'N/A',
                badges: item?.gridVideoRenderer?.badges?.map((badge) => badge.metadataBadgeRenderer.label) || [],
                owner_badges:
                    item?.gridVideoRenderer?.ownerBadges?.map((badge) => badge.metadataBadgeRenderer.tooltip) || [],
            },
        }))
        .filter(
            (el) =>
                el?.metadata?.view_count !== 'N/A' &&
                !el?.metadata?.badges.includes('LIVE') &&
                el?.metadata?.duration !== 'SHORTS',
        )
        .map((el) => ({
            youtube_id: el.id,
            title: el.title,
            description: el.description,
            channel: {
                youtube_id: el.channel.id,
                url: el.channel.url,
                name: el.channel.name,
                profile_image: el.channel.thumbnail.url,
            },
            duration: el.metadata.duration,
            thumbnail: el.metadata.thumbnail.url,
            // moving_thumbnail: el.metadata.moving_thumbnail.url,
            _updatedAt: Sugar.Date.create(el.metadata.published).toJSON() || undefined,
        }));

const idx = videos.findIndex((el) => el.youtube_id === accounts[0]?._youtubeiLastFeedId);
const newVideos = videos.slice(0, idx === -1 ? undefined : idx);
const fullNewVideos = (await Promise.all(newVideos.map((el) => youtube.getDetails(el.youtube_id)))).map((el, idx) => ({
    ...newVideos[idx],
    description: el.description,
}));

console.log(fullNewVideos.map((el) => el.youtube_id));

const count = fullNewVideos.length;
const uids = await unigraph.addObject(fullNewVideos, '$/schema/youtube_video');
const feeds_els = uids;

if (fullNewVideos[0]?.youtube_id) {
    await unigraph.updateObject(
        accounts[0].uid,
        {
            _youtubeiLastFeedId: fullNewVideos[0].youtube_id,
        },
        false,
        false,
    );
}

console.log(`Updated items: ${feeds_els.length}`);

await unigraph.runExecutable('$/executable/add-item-to-list', {
    where: '$/entity/feeds',
    item: feeds_els.reverse(),
});
