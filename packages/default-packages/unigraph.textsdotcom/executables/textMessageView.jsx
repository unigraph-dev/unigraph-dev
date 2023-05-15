const { data, callbacks, inline } = params;

return (
    <div>
        <div
            className={`px-2 py-1.5 rounded-xl mr-2${
                data.get('is_sender').as('primitive') ? ' bg-sky-500 rounded-br' : ' bg-gray-100 rounded-bl'
            }`}
        >
            <span className={`text-sm${data.get('is_sender').as('primitive') ? ' text-white' : ''}`}>
                {data.get('content').as('primitive')}
            </span>
        </div>
        <span className="text-xs text-slate-600 font-medium flex mt-1 pr-3">
            {data.get('is_sender').as('primitive') && <div className="flex-grow" />}
            {data.get('message/sender').as('items')[0].person?._value?._value?._value?.name['_value.%'] ||
                data.get('message/sender').as('items')[0].identifier['_value.%'].slice(1, -1)}
            <span className="mr-1">,</span>
            <ReactTimeAgo timeStyle="twitter" date={new Date(data._updatedAt)} />
        </span>
    </div>
);
