let { uid, newName, subIds } = context.params;
// "0x7ad860", "Meeting note with Aria2" (from "Meeting note with Aria"), N/A
// First, get the old name and everything referencing the old uid

const statusQueryResult = (
    await unigraph.getQueries([
        `(func: uid(${uid})) {
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
<unigraph.origin> @cascade {
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
    _value {
            children {
                <_value[> @filter(has(_key)) {
          uid
          _value {
                        _value {
            type { <unigraph.id> }
                            uid
          }
        }
      _key
        }
  }
  }
}
}`,
    ])
)[0][0];

if (!statusQueryResult) throw new Error("Requested entity doesn't exist.");

const oldNameRef = new UnigraphObject(statusQueryResult['unigraph.indexes'].name).as('primitiveRef');
const oldName = oldNameRef['_value.%'];
newName = newName.replace(/"/g, '\\"');
const updateTriplets = [`<${oldNameRef.uid}> <_value.%> "${newName}" .`];

statusQueryResult['unigraph.origin'].forEach((childRef) => {
    // For every reference, do the following:
    // 1. Rename every children that matches the key & old UID to the new key
    childRef._value.children['_value['].forEach((child) => {
        if (child._key === `[[${oldName}]]` && child._value._value.uid === uid)
            updateTriplets.push(`<${child.uid}> <_key> "[[${newName}]]" .`);
    });
    // 2. Rename the old ref to new one, for each occurence
    const oldRefName = new UnigraphObject(childRef['unigraph.indexes'].name).as('primitiveRef');
    updateTriplets.push(
        `<${oldRefName.uid}> <_value.%> "${oldRefName['_value.%'].replaceAll(`[[${oldName}]]`, `[[${newName}]]`)}" .`,
    );
});

await unigraph.updateTriplets(updateTriplets, undefined, subIds);
