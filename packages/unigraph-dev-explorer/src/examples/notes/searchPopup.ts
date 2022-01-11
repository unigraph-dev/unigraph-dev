export const setSearchPopup = (boxRef: any, searchString: string, onSelected: any, hideHidden?: boolean) => {
    window.unigraph.getState('global/searchPopup').setValue({
        show: true,
        search: searchString,
        anchorEl: boxRef.current,
        hideHidden,
        onSelected,
        default: [
            {
                label: (search: string) => `Create new page named ${search}`,
                onSelected: async (search: string) => {
                    const newUid = await window.unigraph.addObject(
                        {
                            text: {
                                _value: search,
                                type: { 'unigraph.id': '$/schema/markdown' },
                            },
                        },
                        '$/schema/note_block',
                    );
                    // console.log(newUid);
                    return newUid[0];
                },
            },
            {
                label: (search: string) => `Create new tag and page named ${search}`,
                onSelected: async (search: string) => {
                    const newTagUid = await window.unigraph.addObject(
                        {
                            name: search,
                        },
                        '$/schema/tag',
                    );
                    window.unigraph.addObject(
                        {
                            text: {
                                type: { 'unigraph.id': '$/schema/markdown' },
                                _value: search,
                            },
                            children: [
                                {
                                    type: {
                                        'unigraph.id': '$/schema/interface/semantic',
                                    },
                                    _value: {
                                        type: { 'unigraph.id': '$/schema/tag' },
                                        uid: newTagUid[0],
                                    },
                                },
                            ],
                        },
                        '$/schema/note_block',
                    );
                    return newTagUid[0];
                },
            },
        ],
    });
};
