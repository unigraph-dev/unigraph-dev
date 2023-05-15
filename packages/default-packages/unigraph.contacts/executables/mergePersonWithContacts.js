const { uids } = context.params;
const _ = require('lodash');

// Find all potentially duplicate emails
const entities = await unigraph.getQueries(
    uids.map((el) => `(func: uid("${el}")) { uid <_value.%> <~_value> { uid } }`),
    false,
);
const emails = entities
    .map((el) => el[0])
    .map((el) => [el?.['~_value']?.[0]?.uid, (el?.['_value.%'] || '').match(/<(.*)>/g)?.[0]?.slice(1, -1), el.uid])
    .filter((el) => el[0] && el[1]);
const contactsEmails = await unigraph.getQueries(
    emails.map(
        (el) => `(func: uid(parUids)) @cascade {
    uid
    _value {
        emails {
            <_value[> @filter(eq(<_value.%>, "${el[1]}")) {
                <_value.%>
            }
        }
    }
}`,
    ),
    false,
    uids.length,
    `var(func: eq(<unigraph.id>, "$/schema/contact")) { <~type> {parUids as uid} }`,
);
const contactsPhones = await unigraph.getQueries(
    emails.map(
        (el) => `(func: uid(parUids)) @cascade {
    uid
    _value {
        phones {
            <_value[> @filter(eq(<_value.%>, "${el[1]}")) {
                <_value.%>
            }
        }
    }
}`,
    ),
    false,
    uids.length,
    `var(func: eq(<unigraph.id>, "$/schema/contact")) { <~type> {parUids as uid} }`,
);
const contacts = [...contactsEmails, ...contactsPhones];
const replacer = [...emails, ...emails]
    .map((el, index) => [el[0], contacts[index]?.[0]?.uid, el[2]])
    .filter((el) => el[1]);
for (let i = 0; i < replacer.length; ++i) {
    await unigraph.updateObject(
        replacer[i][0],
        {
            _value: { uid: replacer[i][1] },
        },
        true,
        false,
        [],
    );
}
await unigraph.deleteObject(_.uniq(replacer.map((el) => el[2])), true);
