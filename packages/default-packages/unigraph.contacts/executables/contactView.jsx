const { data, callbacks, inline } = params;
const name = data?.get('name')?.as('primitive');

const profiles = data
    ?.get('profiles')
    ?.map((pf) => pf.as('subentity'))
    ?.map((el) => unigraph.getNamespaceMap()[el.type['unigraph.id']]?._icon)
    ?.filter(Boolean)
    ?.map((el) => (
        <span
            style={{
                minWidth: '16px',
                minHeight: '16px',
                width: '16px',
                height: '16px',
                display: 'inline-block',
                marginRight: '2px',
                backgroundImage: `url("data:image/svg+xml,${el}")`,
                opacity: 0.54,
            }}
        />
    ));

if (inline)
    return (
        <strong>
            {data?.get('name')?.as('primitive')}{' '}
            {`<${callbacks.identifier || data._value.emails['_value['][0]['_value.%']}>`}
        </strong>
    );

return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <ListItemIcon>
            <Avatar
                alt={`profile image of ${data.get('name')?.as('primitive')}`}
                src={data.get('profile_image')?.as('primitive')}
            />
        </ListItemIcon>
        <ListItemText>
            <Typography>
                {name || data._value.emails['_value['][0]['_value.%']}
                {profiles ? <span style={{ display: 'inline-block', marginLeft: '8px' }}>{profiles}</span> : undefined}
            </Typography>
            <div style={{ display: 'inline', alignItems: 'center', overflowWrap: 'break-word', color: 'gray' }}>
                {data?.get('children')?.map ? (
                    <div style={{ display: 'inline', marginRight: '8px' }}>
                        {data.get('children').map((it) => (
                            <AutoDynamicView
                                object={new UnigraphObject(it._value)}
                                callbacks={callbacks}
                                options={{ inline: true }}
                                style={{ verticalAlign: 'middle' }}
                            />
                        ))}
                    </div>
                ) : (
                    []
                )}
                <p style={{ fontSize: '0.875rem', display: 'contents' }}>
                    {data.get('emails')['_value['][0]['_value.%']}
                </p>
            </div>
        </ListItemText>
    </div>
);
