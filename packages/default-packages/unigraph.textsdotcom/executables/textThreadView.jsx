const { data, callbacks, inline } = params;

const profile = new UnigraphObject(
    data.get('participants')['_value['].filter((el) => el._value._value._self !== true)[0],
)
    ?.get('profile_image')
    ?.as('primitive');
let name =
    new UnigraphObject(data.get('participants')['_value['].filter((el) => el._value._value._self !== true)[0])
        ?.get?.('name')
        ?.as('primitive') ||
    data
        .get('participants')
        ['_value['].filter((el) => el._value._value._self !== true)[0]
        ?.as('primitive');
if (name.startsWith('<')) name = name.slice(1);

return (
    <div className="w-full flex">
        <div className="mt-1 mr-3 flex-shrink-0">
            {profile ? (
                <img className="inline-block h-8 w-8 rounded-full" src={profile} alt="" />
            ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-400">
                    <span className="text-xs font-medium leading-none text-white">{name?.slice(0, 2)}</span>
                </span>
            )}
        </div>
        <div className="flex-grow">
            <p className="font-medium text-gray-800 text-sm">
                {data
                    .get('participants')
                    ['_value['].filter((el) => el._value._value._self !== true)
                    .map(
                        (el) =>
                            new UnigraphObject(el).get('name')?.as('primitive') ||
                            new UnigraphObject(el).as('primitive'),
                    )
                    .join(', ')}
            </p>
            <p className="text-[13px] text-gray-500 flex items-center">
                <span className="flex-grow">
                    {new UnigraphObject(
                        data
                            .get('messages')
                            ?.['_value['].sort(
                                (a, b) =>
                                    new Date(b._value._updatedAt).getTime() - new Date(a._value._updatedAt).getTime(),
                            )[0],
                    )
                        ?.get('content')
                        ?.as('primitive') || ' '}
                </span>
            </p>
        </div>
        <div className="text-[13px] text-gray-500 flex-shrink-0 min-w-[48px] text-right">
            <div className="flex flex-col gap-0.5">
                <span>
                    <HeroIcons.ClockIcon className="mr-1 h-3 w-3 inline" />
                    <ReactTimeAgo timeStyle="twitter" date={new Date(data._updatedAt)} />
                </span>
            </div>
        </div>
    </div>
);
