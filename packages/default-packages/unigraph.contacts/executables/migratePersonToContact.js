const { email, uid } = context.params;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '$&'); // $& means the whole matched string
}

// Migrate all mentions of this email to the contact specified in UID

// Could be tens of thousands of mentions!
const mentions = await unigraph.getSearchResults(
    [
        { method: 'type', value: '$/schema/person' },
        { method: 'fulltext', value: `/${escapeRegExp(email)}/` },
    ],
    'custom',
    1,
    { noPrimitives: true, body: '@cascade { uid <~_value> { uid <unigraph.origin> { uid } } }' },
);
console.log(mentions.entities.length, JSON.stringify(mentions.entities[0], null, 4));
const triplets = [];
mentions.entities.forEach((el) => {
    const mention = el['~_value'][0];
    triplets.push(
        `<${mention.uid}> <_value> <${uid}> .`,
        ...mention['unigraph.origin'].map((ell) => `<${uid}> <unigraph.origin> <${ell.uid}> .`),
    );
});
await unigraph.updateTriplets(triplets);
await unigraph.deleteObject(mentions.entities.map((el) => el.uid));
