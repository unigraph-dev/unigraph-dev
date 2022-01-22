const { uids } = context.params;
const { google } = require('googleapis');

const gmailClientId = unigraph.getSecret('google', 'client_id');
const gmailClientSecret = unigraph.getSecret('google', 'client_secret');

const account = (
    await unigraph.getQueries([
        `(func: uid(accs)) @cascade {
    uid
    type {<unigraph.id>}
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
        access_token { <_value.%> }
        token_expires_in { <_value.%dt> }
        refresh_token { <_value.%> }
    }
}

var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
    <~type> { accs as uid }
}`,
    ])
)?.[0]?.[0];

const msgIds = (
    await unigraph.getQueries(
        uids.map(
            (el) => `(func: uid(${el})) {
    _value { <message_id> { <_value.%> } }
}`,
        ),
    )
).map((el) => el?.[0]?._value?.message_id?.['_value.%']);

if (account?.uid) {
    const token = account._value.access_token['_value.%'];
    const auth = new google.auth.OAuth2(gmailClientId, gmailClientSecret, 'https://localhost:4001/callback?key=gmail');
    auth.setCredentials({ access_token: token });

    const gmail = google.gmail({
        version: 'v1',
        auth,
    });

    const gmailIds = await Promise.all(
        msgIds.map((el) => gmail.users.messages.list({ userId: 'me', q: `rfc822msgid:${el}` })),
    );
    const mids = gmailIds.map((el) => el.data?.messages?.[0]?.id).filter((el) => el !== undefined);

    await gmail.users.messages.batchModify({
        userId: 'me',
        ids: mids,
        removeLabelIds: ['UNREAD'],
    });
}
