const { data, callbacks, inline } = params;
const [innerExpanded, setInnerExpanded] = React.useState(false);
const hide = data.get('thumbnail').as('primitive') === 'self' && data.get('selftext').as('primitive') === '';

const [extraData, setExtraData] = React.useState({});

React.useEffect(() => {
    if (data?.get('url')?.as('primitive')?.startsWith('https://www.reddit.com/gallery/')) {
        fetch(`https://www.reddit.com/by_id/${data?.get('id')?.as('primitive')}/.json`)
            .then((el) => el.json())
            .then((json) => setExtraData(json?.data?.children?.[0]?.data));
    }
}, []);

const getThumbnail = (url) => {
    if (url === 'image') {
        return (
            <Avatar variant="rounded">
                <Image />
            </Avatar>
        );
    }
    if (url === 'default') {
        return (
            <Avatar variant="rounded">
                <Link />
            </Avatar>
        );
    }
    if (url === 'self') {
        return (
            <Avatar variant="rounded">
                <Chat />
            </Avatar>
        );
    }
    return <Avatar variant="rounded" src={url} />;
};

const getDetail = (url) => {
    if (url.startsWith('https://v.redd.it/')) {
        return (
            <ReactPlayer url={`${url}/HLSPlaylist.m3u8`} style={{ maxWidth: '100%' }} controls playing muted alt="" />
        );
    }
    if (url.startsWith('https://youtu.be/')) {
        return <ReactPlayer url={url} style={{ maxWidth: '100%' }} controls playing muted alt="" />;
    }
    if (url.startsWith('https://www.reddit.com/gallery/')) {
        console.log(Object.values(extraData?.media_metadata || {}));
        return (
            <ImageGallery
                items={Object.values(extraData?.media_metadata || {}).map((el) => ({
                    original: htmlDecode(el?.p?.pop?.()?.u),
                    thumbnail: htmlDecode(el?.s?.u),
                }))}
            />
        );
    }
    if (url.startsWith('https://imgur.com/')) {
        return <img src={`${url}.png`} style={{ maxWidth: '100%' }} alt="" />;
    }
    if (url.startsWith('https://gfycat.com/')) {
        const finalUrl = url.replace('https://gfycat.com/', 'https://gfycat.com/ifr/');
        return <iframe src={`${finalUrl}?controls=0`} style={{ maxWidth: '100%' }} alt="" frameBorder={0} />;
    }
    return <img src={url} style={{ maxWidth: '100%' }} alt="" />;
};

return (
    <div style={{ display: 'flex' }}>
        <div
            style={{
                alignSelf: 'baseline',
                marginRight: '16px',
                marginTop: '8px',
            }}
        >
            <Badge
                overlap="circular"
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                badgeContent={
                    <Avatar
                        style={{ height: '16px', width: '16px' }}
                        alt="Reddit"
                        src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png"
                    />
                }
            >
                {getThumbnail(data.get('thumbnail').as('primitive'))}
            </Badge>
        </div>

        <div>
            <Typography variant="body1" style={{ marginRight: '8px' }}>
                {data.get('name').as('primitive')}
            </Typography>
            <div style={{ display: 'flex', color: 'gray', alignItems: 'baseline' }}>
                <div style={{ alignSelf: 'center', marginRight: '6px' }}>
                    {(data?._value?.children?.['_value['] || []).map((el) => {
                        const elObj = el._value._value;
                        return (
                            <AutoDynamicView
                                object={new UnigraphObject(elObj)}
                                callbacks={{ context: data }}
                                options={{ inline: true }}
                            />
                        );
                    })}
                </div>
                {innerExpanded ? (
                    <RemoveCircle
                        onClick={() => {
                            setInnerExpanded(!innerExpanded);
                        }}
                        style={{
                            alignSelf: 'center',
                            marginRight: '4px',
                            display: hide ? 'none' : '',
                        }}
                    />
                ) : (
                    <AddCircle
                        onClick={() => {
                            setInnerExpanded(!innerExpanded);
                        }}
                        style={{
                            alignSelf: 'normal',
                            marginRight: '4px',
                            display: hide ? 'none' : '',
                            transform: 'scale(0.8)',
                        }}
                    />
                )}
                <Typography
                    variant="body2"
                    style={{
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        marginRight: '4px',
                    }}
                    onClick={() => {
                        if (callbacks?.removeFromContext && callbacks?.removeOnEnter) callbacks.removeFromContext();
                        window.open(data.get('permalink').as('primitive'), '_blank');
                    }}
                >
                    Comment
                </Typography>
                •
                <Typography variant="body2" style={{ marginLeft: '4px' }}>
                    Submitted {Sugar.Date.relative(new Date(data._updatedAt || data._timestamp._updatedAt))} to r/
                    <span
                        style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        onClick={() =>
                            window.open(`https://reddit.com/r/${data.get('subreddit/name').as('primitive')}`, '_blank')
                        }
                    >
                        {data.get('subreddit/name').as('primitive')}
                    </span>
                </Typography>
            </div>
            {innerExpanded ? (
                <div style={{ marginLeft: isSmallScreen() ? '-56px' : '' }}>
                    {data.get('selftext').as('primitive').length ? (
                        <AutoDynamicView object={new UnigraphObject(data.get('selftext')._value._value)} />
                    ) : (
                        getDetail(data.get('url').as('primitive'))
                    )}
                </div>
            ) : (
                []
            )}
        </div>
    </div>
);
