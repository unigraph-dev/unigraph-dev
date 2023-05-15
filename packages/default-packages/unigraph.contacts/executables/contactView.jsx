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

if (inline) return <span>{data?.get('name')?.as('primitive')}</span>;

return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
            alt={`profile image of ${data.get('name')?.as('primitive')}`}
            src={data.get('profile_image')?.as('primitive')}
            sx={{ width: 36, height: 36 }}
        >
            <span className="text-base">
                {data
                    .get('name')
                    ?.as('primitive')
                    .split(' ')
                    .map((el) => el[0])
                    .join('')}
            </span>
        </Avatar>
        <div className="flex flex-col ml-3">
            <div className="font-medium text-grey-600 text-[15px]">
                {name || data._value.emails['_value[']?.[0]['_value.%']}
                {profiles ? <span style={{ display: 'inline-block', marginLeft: '8px' }}>{profiles}</span> : undefined}
            </div>
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

                <p className="text-[13px] gap-4 flex">
                    {data.get('emails')?.['_value[']?.[0]['_value.%'] && (
                        <span>
                            <HeroIcons.EnvelopeIcon className="w-[14px] h-[14px] inline mr-1" />{' '}
                            {data.get('emails')?.['_value[']?.[0]['_value.%']}
                        </span>
                    )}
                    {data.get('phones')?.['_value[']?.[0]['_value.%'] && (
                        <span>
                            <HeroIcons.PhoneIcon className="w-[14px] h-[14px] inline mr-1" />{' '}
                            {data.get('phones')?.['_value[']?.[0]['_value.%']}
                        </span>
                    )}
                </p>
            </div>
        </div>
    </div>
);
