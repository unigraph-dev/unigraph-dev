let destUidOrName = context.params.where;
let sourceUid = context.params.item;
let destUid;

if (destUidOrName.startsWith('$/entity')) {
    // Named entity
    destUid = unigraph.getNamespaceMapUid(destUidOrName)
} else if (destUidOrName.startsWith('0x')) {
    // UID
    destUid = destUidOrName;
} else {
    throw new Error("Destination is not valid - should either be a named entity or an UID.")
}

const sources = !Array.isArray(sourceUid) ? [sourceUid] : sourceUid

console.log(sources, destUid)

await unigraph.updateObject(destUid, {
    children: sources.map(el => {return {
        "type": {"unigraph.id": "$/schema/subentity"},
        "_value": {
            uid: el
        }
    }})
}, true, true);

