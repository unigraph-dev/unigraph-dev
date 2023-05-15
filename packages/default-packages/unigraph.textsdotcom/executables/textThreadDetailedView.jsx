const { data, callbacks, inline } = params;

return (
    <div className="px-4 pt-2 flex flex-col gap-2">
        {data
            .get('messages')
            .as('items')
            .sort(byUpdatedAt)
            .map((el) => (
                <div className="w-full flex">
                    {new UnigraphObject(el).get('is_sender').as('primitive') && <div className="flex-grow" />}
                    <div className="max-w-[75%]">
                        <AutoDynamicView object={el} />
                    </div>
                </div>
            ))}
    </div>
);
