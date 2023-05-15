const its = context.params.uids;
const pineconeKey = unigraph.getSecret('pinecone', 'api_key');
const domainUid = unigraph.getNamespaceMapUid('$/entity/domains');
const feedsUid = unigraph.getNamespaceMapUid('$/entity/feeds');

const res = await unigraph.getQueries([
    `(func: uid(${its.join(
        ', ',
    )})) @filter(NOT has(_tagged) AND has(_embedding) AND uid_in(<unigraph.origin>, [${domainUid}, ${feedsUid}])) {
    uid
    <unigraph.origin> { uid }
}`,
]);
const uids = res[0] || [];
// console.log(res);

// update metadata on pinecone for each uid
if (uids.length === 0) return;

const fetch = require('node-fetch');

const domainUids = uids.filter((el) => el['unigraph.origin']?.map((el) => el.uid).includes(domainUid));
const feedsUids = uids.filter((el) => el['unigraph.origin']?.map((el) => el.uid).includes(feedsUid));
if (domainUids.length > 0) {
    await Promise.all(
        domainUids.map((it) =>
            fetch(`${unigraph.getSecret('pinecone', 'endpoint_url')}/vectors/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': pineconeKey,
                },
                body: JSON.stringify({
                    id: it.uid,
                    setMetadata: { domainTag: true },
                    namespace: 'search',
                }),
            }),
        ),
    );
    console.log(`[Semantic Index] Successfully added ${uids.length} tags as categories.`);
}

if (feedsUids.length > 0) {
    unigraph.updateTriplets(
        feedsUids.map((el) => `<${el.uid}> <_tagged> "true"^^<xs:boolean> .`),
        undefined,
        [],
    );
    feedsUids.forEach((el) => unigraph.runExecutable('$/executable/auto-tag-entity', { uid: el.uid }));
}
