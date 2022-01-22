const destUidOrName = context.params.where;
const sourceUid = context.params.item;
const { indexes, subIds } = context.params;
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

const sources = !Array.isArray(sourceUid) ? [sourceUid] : sourceUid;

console.log(sources, destUid);
if (sources.length === 0) return;

await unigraph.updateObject(
    destUid,
    {
        children: sources.map((el) => {
            return {
                type: { 'unigraph.id': '$/schema/subentity' },
                _value: {
                    uid: el,
                },
            };
        }),
    },
    true,
    true,
    indexes ? [] : subIds,
);

if (indexes && Array.isArray(indexes) && indexes.length === sources.length) {
    // Now do reorder
    const listRes = await unigraph.getQueries([`(func: uid(${destUid})) { _value { children { uid } } }`]);
    const listUid = listRes?.[0]?.[0]?._value?.children?.uid;
    if (listUid)
        await unigraph.reorderItemInArray(
            listUid,
            sources.map((el, idx) => [el, indexes[idx]]),
            undefined,
            subIds,
        );
}
