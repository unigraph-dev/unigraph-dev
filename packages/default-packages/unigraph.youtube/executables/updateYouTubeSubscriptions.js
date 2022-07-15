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

function toDuration(duration) {
    const sec_num = parseInt(duration, 10); // don't forget the second param
    const hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - hours * 3600) / 60);
    let seconds = sec_num - hours * 3600 - minutes * 60;

    if (minutes < 10) {
        minutes = `0${minutes}`;
    }
    if (seconds < 10) {
        seconds = `0${seconds}`;
    }
    return `${(hours ? `${hours}:` : '') + minutes}:${seconds}`;
}

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

async function syncRlwithWl() {
    const subsFeed = await youtube.getPlaylist('WL', { client: 'YOUTUBE' });
    const wlIts = (subsFeed?.items || []).map((el) => el.id);
    const rlIts = (
        (
            await unigraph.getQueries([
                `(func: uid(${unigraph.getNamespaceMapUid('$/entity/read_later')})) {
        uid
        _value {
            children {
                <_value[> {
                    _value {
                        _value {
                            uid
                            _shouldInWL
                            _value {
                                youtube_id {
                                    <_value.%>
                                }
                            }
                        }
                    }
                }
            }
        }
    }`,
            ])
        )[0]?.[0]?._value?.children?.['_value['] || []
    )
        ?.map((el) => ({
            uid: el?._value?._value?.uid,
            _shouldInWL: el?._value?._value?._shouldInWL || false,
            youtube_id: el?._value?._value?._value?.youtube_id['_value.%'],
        }))
        ?.filter((el) => el.uid && el.youtube_id);

    // Sync up
    const rlNotInWl = rlIts.filter((el) => !wlIts.includes(el.youtube_id));
    const toAdd = [];
    const toDel = [];
    await Promise.all(
        rlNotInWl.map(async ({ uid, youtube_id, _shouldInWL }) => {
            if (_shouldInWL) {
                // Should remove the flag, and remove from local RL
                await unigraph.updateTriplets([`<${uid}> <_shouldInWL> * .`], true, []);
                toDel.push(uid);
            } else {
                // Should add the flag, and add to WL
                await unigraph.updateTriplets([`<${uid}> <_shouldInWL> "true"^^<xs:boolean> .`], false, []);
                toAdd.push(youtube_id);
            }
        }),
    );
    await youtube.playlist.addVideos('WL', toAdd);
    await unigraph.runExecutable('$/executable/delete-item-from-list', {
        where: '$/entity/read_later',
        item: toDel,
    });

    // Sync down
    const wlNotInRl = wlIts.filter((el) => !rlIts.map((el) => el.youtube_id).includes(el));
    const locallyRemovedVideos =
        (
            await unigraph.getQueries([
                `(func: uid(parLst)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @cascade {
        uid
        _shouldInWL
        _value {
            youtube_id {
                <_value.%>
            }
        }
    }
    var(func: eq(<unigraph.id>, "$/schema/youtube_video")) {
        <~type> { parLst as uid }
    }`,
            ])
        )[0] || [];
    const locallyRemovedVideosId = locallyRemovedVideos.map((el) => el._value.youtube_id['_value.%']);

    const videoDetails = await Promise.all(wlNotInRl.map((id) => youtube.getDetails(id)));
    const videos = [];
    const toDelRemote = [];
    videoDetails.map((video) => {
        if (!locallyRemovedVideosId.includes(video.id)) {
            videos.push({
                $context: {
                    _shouldInWL: true,
                },
                channel: {
                    name: video.metadata.channel_name,
                    url: video.metadata.channel_url,
                    youtube_id: video.metadata.channel_id,
                },
                _updatedAt: new Date(video.metadata.publish_date).toJSON(),
                description: video.description,
                duration: toDuration(video.metadata.length_seconds),
                thumbnail: video.thumbnail.url,
                title: video.title,
                youtube_id: video.id,
            });
        } else {
            const uids = locallyRemovedVideos
                .filter((el) => el._value.youtube_id['_value.%'] === video.id)
                .map((el) => el.uid);
            if (uids.length)
                unigraph.updateTriplets(
                    uids.map((uid) => `<${uid}> <_shouldInWL> * .`),
                    true,
                    [],
                );
            toDelRemote.push(video.id);
        }
    });

    if (toDelRemote.length) await youtube.playlist.removeVideos('WL', toDelRemote);

    if (videos.length) {
        const uids = await unigraph.addObject(videos, '$/schema/youtube_video', undefined, []);
        await unigraph.runExecutable('$/executable/add-item-to-list', {
            where: '$/entity/read_later',
            item: uids,
        });
    }
}

syncRlwithWl();

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

const idx = videos.findIndex((el) => accounts[0]._youtubeiLastFeedId.split('|').includes(el.youtube_id));
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
            _youtubeiLastFeedId: videos.map((el) => el.youtube_id).join('|'),
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
