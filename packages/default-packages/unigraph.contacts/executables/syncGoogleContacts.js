const { google } = require('googleapis');

const gmailClientId = unigraph.getSecret('google', 'client_id');
const gmailClientSecret = unigraph.getSecret('google', 'client_secret');
const fetch = require('node-fetch');
const _ = require('lodash/fp');

const accounts = (
    await unigraph.getQueries([
        `(func: uid(parAcc)) @filter((NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @cascade {
            uid
            type @filter(eq(<unigraph.id>, "$/schema/internet_account")) {<unigraph.id>}
            _value {
                site {
                    _value {
                        _value {
                            name @filter(eq(<_value.%>, "Google")) {
                                <_value.%>
                            }
                        }
                    }
                }
                name { <_value.%> }
                username { <_value.%> }
                access_token { <_value.%> }
                token_expires_in { <_value.%dt> }
                refresh_token { <_value.%> }
            }
        } var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
            <~type> { parAcc as uid }
        }`,
    ])
)?.[0];
// )?.[0]?.[0];

const getQuery = (contactId) => `(func: eq(<_resourceName>, "${contactId}")) { 
    uid
}`; // TODO: index this predicate

const syncContacts = async (account) => {
    const token = account._value.access_token['_value.%'];

    const auth = new google.auth.OAuth2(gmailClientId, gmailClientSecret, 'https://localhost:4001/callback?key=gmail');
    auth.setCredentials({ access_token: token });

    const people = google.people({ version: 'v1', auth });

    const {
        data: { connections },
    } = await people.people.connections.list({
        personFields: ['names', 'emailAddresses', 'photos', 'phoneNumbers'],
        resourceName: 'people/me',
        pageSize: 100, // TODO: Dunbar's number break
    });
    console.log("\n\nUser's Connections:\n");

    const simplifiedList = connections.map((el) => ({
        name: el.names[0].unstructuredName,
        profile_image: el.photos.find((el) => el.default !== true)?.url || undefined,
        emails: _.uniq((el.emailAddresses || []).map((el) => el.value)),
        phones: _.uniq((el.phoneNumbers || []).map((el) => el.canonicalForm)),
        $context: {
            _resourceName: el.resourceName,
        },
    }));
    console.log(simplifiedList.length);

    const results = await unigraph.getQueries(
        [...simplifiedList.map((el) => getQuery(el.$context._resourceName))],
        false,
        200,
    );

    console.log(results);

    for (let i = 0; i < simplifiedList.length; ++i) {
        if (results[i]?.length !== 0) continue;
        const contact = simplifiedList[i];
        const [uid] = await unigraph.addObject(contact, '$/schema/contact');
        if (contact.emails?.length) {
            for (let j = 0; j < contact.emails.length; ++j) {
                await unigraph.runExecutable('$/executable/migrate-person-to-contact', {
                    email: contact.emails[j],
                    uid,
                });
            }
        }
    }
};

await Promise.all(accounts.filter((account) => account?.uid).map(syncContacts));
