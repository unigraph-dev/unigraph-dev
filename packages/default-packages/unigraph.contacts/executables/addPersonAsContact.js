const { uid } = context.params;

// Add this person (with UID) as a contact, then change all occurances of this person (with email) to the new contact object.

const entity = (await unigraph.getQueries(`(func: uid("${uid}")) @cascade { <_value.%> }`, false))?.[0]?.[0];
if (!entity) throw new Error('This person does not exist!');

const value = entity['_value.%'];
const email = value.match(/<(.*)>/g)?.[0];
const newName = value.replace(email, '').trim();

const uids = await unigraph.addObject(
    {
        name: newName.length > 0 ? newName : email?.slice(1, -1),
        emails: [email?.slice(1, -1)],
    },
    '$/schema/contact',
);
await unigraph.runExecutable('$/executable/migrate-person-to-contact', { email: email?.slice(1, -1), uid: uids[0] });
