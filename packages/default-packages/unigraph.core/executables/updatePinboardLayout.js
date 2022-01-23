const layout = context.params.newLayout;
const destUidOrName = context.params.where;
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

const currBoard = (
    await unigraph.getQueries([
        `(func: uid(${destUid})) { _value { _value { children { <_value[> { uid _value { _value { uid } } } } } } }`,
    ])
)[0][0];
const newObjects = currBoard._value._value.children['_value['].map((el) => {
    const { i, x, y, w, h } = layout.filter((ell) => ell.i === el._value._value.uid)[0];
    return `<${el.uid}> <_pos> "${[x.toString(), y.toString(), w.toString(), h.toString()].join(':')}" .`;
});

await unigraph.updateTriplets(newObjects);
