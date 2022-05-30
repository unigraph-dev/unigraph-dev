export const setSearchPopup = (boxRef: any, searchString: string, onSelected: any, hideHidden?: boolean) => {
    window.unigraph.getState('global/searchPopup').setValue({
        show: true,
        preview: true,
        search: searchString,
        anchorEl: boxRef.current,
        hideHidden,
        onSelected,
        default: [
            {
                label: (search: string) => `Create new page named ${search}`,
                onSelected: async (search: string) => {
                    const newUid = (window.unigraph as any).leaseUid();
                    window.unigraph.addObject(
                        {
                            uid: newUid,
                            text: {
                                _value: search,
                                type: { 'unigraph.id': '$/schema/markdown' },
                            },
                        },
                        '$/schema/note_block',
                    );
                    // console.log(newUid);
                    return [newUid, '$/schema/note_block'];
                },
            },
            {
                label: (search: string) => `Create new tag and page named ${search}`,
                onSelected: async (search: string) => {
                    const newUid = (window.unigraph as any).leaseUid();
                    window.unigraph.addObject(
                        {
                            uid: newUid,
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
                                        uid: newUid,
                                    },
                                },
                            ],
                        },
                        '$/schema/note_block',
                    );
                    return [newUid, '$/schema/tag'];
                },
            },
        ],
    });
};
