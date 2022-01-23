const { uid } = context.params;

const newNote = (
    await unigraph.addObject(
        {
            text: {
                _value: '',
                type: { 'unigraph.id': '$/schema/markdown' },
            },
        },
        '$/schema/note_block',
    )
)[0];
unigraph.runExecutable('$/executable/add-item-to-list', { where: uid, item: newNote });
window?.wsnavigator?.(`/library/object?uid=${newNote}&viewer=${'dynamic-view-detailed'}&type=$/schema/note_block`);
