const destUidOrName = context.params.where;
const sourceUid = context.params.item;
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

const destObj = await unigraph.getQueries([`(func: uid(${destUid})) {uid _value { children { uid } }}`]);
const childrenUid = destObj[0][0]._value.children.uid;

await unigraph.deleteItemFromArray(childrenUid, sourceUid, destUid);
