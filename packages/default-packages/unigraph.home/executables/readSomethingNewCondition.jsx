const feedsUid = unigraph.getNamespaceMapUid('$/entity/feeds');
const readLaterUid = unigraph.getNamespaceMapUid('$/entity/read_later');
const feedItems = await unigraph.getQueries([
    `(func: uid(${feedsUid})) @normalize { _value { children { <_value[> {items: count(uid)} } } }`,
    `(func: uid(${readLaterUid})) @normalize { _value { children { <_value[> {items: count(uid)} } } }`,
]);
const finalItems = (feedItems[0]?.[0]?.items || 0) + (feedItems[1]?.[0]?.items || 0);
return finalItems > 0;
