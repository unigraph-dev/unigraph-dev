const { data, callbacks, inline } = params;

const [views, setViews] = React.useState('');
const [over, setOver] = React.useState(false);

React.useEffect(async () => {
    function viewCountFormat(bytes) {
        const s = ['', 'K', 'M', 'B'];
        const e = Math.floor(Math.log(bytes) / Math.log(1000));
        return `${(bytes / 1000 ** e).toFixed(e === 0 ? 0 : 2)} ${s[e]}`;
    }

    const res = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${data
            .get('youtube_id')
            .as('primitive')}&key=AIzaSyBjbBBbBXybgvhMwbW9bNAMbvDm-aRJVkA`,
    );
    const details = await res.json();
    setViews(`${viewCountFormat(details.items[0].statistics.viewCount)} views`);
}, []);

return (
    <ReactResizeDetector handleWidth handleHeight>
        {({ width, height }) => (
            <div
                style={{ display: 'flex', cursor: 'pointer', flexWrap: width <= 600 ? 'wrap' : undefined }}
                onMouseOver={() => setOver(true)}
                onMouseOut={() => setOver(false)}
                onClick={() => {
                    window.open(`https://youtube.com/watch?v=${data.get('youtube_id').as('primitive')}`, '_blank');
                }}
            >
                <div
                    style={{
                        alignSelf: 'baseline',
                        marginRight: width <= 600 ? undefined : '16px',
                        width: width <= 600 ? '100%' : undefined,
                    }}
                >
                    <Badge
                        overlap="circular"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        sx={{ width: width <= 600 ? '100%' : undefined }}
                        badgeContent={
                            <Typography
                                variant="body1"
                                style={{
                                    fontSize: '14px',
                                    backgroundColor: '#ffffffaa',
                                    padding: '2px',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                }}
                            >
                                {data.get('duration').as('primitive')}
                            </Typography>
                        }
                    >
                        <img
                            src={data.get('thumbnail').as('primitive')}
                            style={{
                                height: width <= 600 ? '100%' : '120px',
                                width: width <= 600 ? '100%' : undefined,
                                borderRadius: '4px',
                            }}
                        />
                        <img
                            src={data.get('moving_thumbnail')?.as('primitive')}
                            style={{
                                height: width <= 600 ? '100%' : '120px',
                                width: width <= 600 ? '100%' : undefined,
                                borderRadius: '4px',
                                position: 'absolute',
                                opacity: over && data.get('moving_thumbnail')?.as('primitive') ? 1 : 0,
                            }}
                        />
                    </Badge>
                </div>

                <div style={{ marginTop: width <= 600 ? '8px' : '' }}>
                    <Typography variant="body1" style={{ marginRight: '8px' }}>
                        {data.get('title').as('primitive')}
                    </Typography>
                    <div style={{ display: 'flex', color: 'gray', alignItems: 'center', marginTop: '6px' }}>
                        <img
                            src={data.get('channel/profile_image').as('primitive')}
                            style={{ height: '32px', borderRadius: '16px' }}
                        />
                        <Typography variant="body1" style={{ marginLeft: '8px', fontSize: '14px', marginRight: '4px' }}>
                            {data.get('channel/name').as('primitive')}
                        </Typography>
                        •
                        <Typography variant="body1" style={{ marginLeft: '4px', fontSize: '14px', marginRight: '4px' }}>
                            {Sugar.Date.relative(new Date(data._updatedAt))}
                        </Typography>
                        •
                        <Typography variant="body1" style={{ marginLeft: '4px', fontSize: '14px', marginRight: '4px' }}>
                            {views}
                        </Typography>
                        {(data?._value?.children?.['_value['] || []).length ? '•' : ''}
                        <div style={{ alignSelf: 'center', marginLeft: '4px' }}>
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
                    </div>
                    <div style={{ display: 'flex', color: 'gray', marginTop: '4px' }}>
                        <Typography variant="body1" style={{ fontSize: '14px' }}>
                            {data.get('description')?.as('primitive').slice(0, 280)}
                            {data.get('description')?.as('primitive').length > 280 ? '...' : ''}
                        </Typography>
                    </div>
                </div>
            </div>
        )}
    </ReactResizeDetector>
);
