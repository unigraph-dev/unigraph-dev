/* Expected params: {
    where: <a string of UID or shorthand reference name>, 
    item: <a unigraph entity or UID>, 
    pos: <string of the form: "x:y:w:h">, 
}
*/

const destUidOrName = context.params.where;
let sourceUid = context.params.item;
let destUid;

if (destUidOrName.startsWith('$/entity')) {
    // Named entity
    destUid = unigraph.getNamespaceMapUid(destUidOrName);
} else if (destUidOrName.startsWith('0x')) {
    // UID
    destUid = destUidOrName;
} else {
    throw new Error('Destination is not valid - should either be a named entity or an UID.');
}

if (!sourceUid.startsWith?.('0x') && sourceUid.type) {
    // is an item, add & set to UID
    const type = sourceUid.type['unigraph.id'];
    delete sourceUid.type;
    const uids = await unigraph.addObject(sourceUid, type);
    sourceUid = uids[0];
}

// Actually update the pinboard
await unigraph.updateObject(
    destUid,
    {
        _value: {
            _value: {
                children: {
                    '_value[': [
                        {
                            _index: { '_value.#i': 0 }, // We don't sort by index because this is a pinboard
                            _pos: context.params.pos,
                            _value: {
                                type: { 'unigraph.id': '$/schema/subentity' },
                                _value: {
                                    uid: sourceUid,
                                },
                            },
                        },
                    ],
                },
            },
        },
    },
    true,
    false,
    context.params.subsId || undefined,
);
