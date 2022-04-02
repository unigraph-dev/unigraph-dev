const { data, callbacks, inline } = params;
const [innerExpanded, setInnerExpanded] = React.useState(false);
const hide = data.get('thumbnail').as('primitive') === 'self' && data.get('selftext').as('primitive') === '';

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
            <div style={{ display: 'flex', color: 'gray' }}>
                {innerExpanded ? (
                    <RemoveCircle
                        onClick={() => {
                            setInnerExpanded(!innerExpanded);
                        }}
                        style={{
                            alignSelf: 'center',
                            marginRight: '8px',
                            display: hide ? 'none' : '',
                        }}
                    />
                ) : (
                    <AddCircle
                        onClick={() => {
                            setInnerExpanded(!innerExpanded);
                        }}
                        style={{
                            alignSelf: 'center',
                            marginRight: '8px',
                            display: hide ? 'none' : '',
                        }}
                    />
                )}
                <div>
                    <Typography variant="body2">
                        Submitted
                        {Sugar.Date.relative(new Date(data._updatedAt || data._timestamp._updatedAt))} to r/
                        {data.get('subreddit/name').as('primitive')}
                    </Typography>
                    <div
                        style={{
                            color: 'gray',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            if (callbacks?.removeFromContext && callbacks?.removeOnEnter) callbacks.removeFromContext();
                            window.open(data.get('permalink').as('primitive'), '_blank');
                        }}
                    >
                        Comment
                    </div>
                </div>
            </div>
            {innerExpanded ? (
                <div>
                    {data.get('selftext').as('primitive').length ? (
                        <AutoDynamicView object={new UnigraphObject(data.get('selftext')._value._value)} />
                    ) : (
                        <img src={data.get('url').as('primitive')} style={{ maxWidth: '100%' }} alt="" />
                    )}
                </div>
            ) : (
                []
            )}
        </div>
    </div>
);
