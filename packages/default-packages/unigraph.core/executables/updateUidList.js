const { uids } = context.params;
const listUidOrName = context.params.listUid;
let listUid;

if (listUidOrName.startsWith('$/entity')) {
    // Named entity
    listUid = unigraph.getNamespaceMapUid(listUidOrName);
} else if (listUidOrName.startsWith('0x')) {
    // UID
    listUid = listUidOrName;
} else {
    throw new Error('Destination is not valid - should either be a named entity or an UID.');
}

return unigraph.updateObject(
    listUid,
    {
        '_value[': uids.map((el) => ({ _value: { uid: el } })),
    },
    false,
    false,
    [],
    [],
);
