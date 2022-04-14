const fromUid = context.params.from;
const toUid = context.params.to;

const newNameQuery = (
    await unigraph.getQueries([
        `(func: uid(${toUid})) {
    uid
unigraph.indexes {
        name {
    uid
            expand(_userpredicate_) {uid
            expand(_userpredicate_) {uid
            expand(_userpredicate_) {uid
            expand(_userpredicate_) {uid
            expand(_userpredicate_) {uid
            expand(_userpredicate_) { } } } } } }
  }
}
}`,
    ])
)[0][0];
const newName = new UnigraphObject(newNameQuery['unigraph.indexes'].name).as('primitive');
await unigraph.runExecutable('$/executable/rename-entity', {
    uid: fromUid,
    newName,
});

const refs = await unigraph.getQueries([
    `(func: uid(${fromUid})) {
    <~_value> {
			uid
  	}
  	<unigraph.origin> {
			uid
		}
	}`,
]);

const valUids = refs?.[0]?.[0]?.['~_value'].map((el) => el.uid);
const originUids = refs?.[0]?.[0]?.['unigraph.origin'].map((el) => el.uid);

const updateTriplets = [
    ...valUids.map((uid) => `<${uid}> <_value> <${toUid}> .`),
    ...originUids.map((uid) => `<${toUid}> <unigraph.origin> <${uid}> .`),
];

await unigraph.updateTriplets(updateTriplets);
await unigraph.deleteObject(fromUid, true);
