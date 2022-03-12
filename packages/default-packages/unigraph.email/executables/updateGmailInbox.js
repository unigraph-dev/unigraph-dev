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

const getQuery = (msgid) => `(func: uid(parIds)) @cascade { 
    uid
    _value {
      message_id @filter(eq(<_value.%>, "${msgid}"))
    }
}`;

const updateAccountInbox = async (account) => {
    let token = account._value.access_token['_value.%'];
    const refresh = account._value.refresh_token['_value.%'];

    const resp = await fetch('https://www.googleapis.com/oauth2/v4/token', {
        method: 'POST',
        body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refresh,
            client_id: gmailClientId,
            client_secret: gmailClientSecret,
        }),
    });

    const accessTokenResult = await resp.json();
    if (accessTokenResult.access_token) token = accessTokenResult.access_token;

    await unigraph.updateObject(account.uid, {
        access_token: token,
        token_expires_in: new Date(new Date().getTime() + 3600 * 1000).toISOString(),
    });

    const auth = new google.auth.OAuth2(gmailClientId, gmailClientSecret, 'https://localhost:4001/callback?key=gmail');
    auth.setCredentials({ ...accessTokenResult, access_token: token });

    const gmail = google.gmail({
        version: 'v1',
        auth,
    });

    const res = await gmail.users.messages.list({ userId: 'me', maxResults: 50, includeSpamTrash: true });
    const messages = res.data.messages.map((el) => el.id);

    const msgIdResps = await Promise.all(
        messages.map((id) =>
            gmail.users.messages.get({
                userId: 'me',
                id,
                format: 'metadata',
                metadataHeaders: ['Message-Id'],
            }),
        ),
    );

    const msgIds = msgIdResps.map((el) => el.data.payload.headers[0].value);

    const results = await unigraph.getQueries(
        [...msgIds.map((el) => getQuery(el))],
        false,
        50,
        `var(func: eq(<unigraph.id>, "$/schema/email_message")) {
        <~type> { parIds as uid }
    }`,
    );

    const msgResps = await Promise.all(
        messages.map((id) => gmail.users.messages.get({ userId: 'me', id, format: 'raw' })),
    );
    const inbox = await unigraph.getObject('$/entity/inbox');
    const inboxEntries = inbox._value.children['_value['] ?? [];
    const inboxEntryUids = inboxEntries.map((x) => x._value._value.uid);

    const getOldUid = _.curry((condition, el, index) => {
        const isCondition = condition(el);
        const isOld = results[index].length !== 0;
        return isCondition && isOld ? results[index]?.[0].uid : undefined;
    });
    const isOldAndInOriginTrash = getOldUid(
        (el) => el.data.labelIds?.includes('TRASH') || el.data.labelIds?.includes('SPAM'),
    );
    const isOldAndInOriginInbox = getOldUid((el) => el.data.labelIds?.includes('INBOX'));
    const isOldAndNotInOriginInbox = getOldUid((el) => !el.data.labelIds?.includes('INBOX'));

    const uidsToDelete = msgResps.map(isOldAndInOriginTrash).filter((el) => el !== undefined);
    const uidsToInbox = msgResps
        .map(isOldAndInOriginInbox)
        .filter((el) => el !== undefined)
        .filter((x) => !inboxEntryUids.includes(x));
    const uidsToRemoveInbox = msgResps.map(isOldAndNotInOriginInbox).filter((el) => el !== undefined);

    // TODO: remove or hide deleted msgs

    // Do not insert drafts to Unigraph
    const newMsgResps = msgResps
        .filter((el, index) => results[index].length === 0)
        .filter((el) => _.intersection(el.data.labelIds, ['DRAFT', 'TRASH', 'SPAM']).length === 0);

    if (newMsgResps.length) {
        await unigraph.runExecutable('$/executable/add-email', {
            dont_check_unique: true,
            messages: newMsgResps.map((el) => ({
                message: Buffer.from(el.data.raw, 'base64').toString(),
                read: !el.data.labelIds?.includes('UNREAD'),
                inbox: el.data.labelIds?.includes('INBOX'),
            })),
        });
    }
    await unigraph.runExecutable('$/executable/add-item-to-list', {
        where: '$/entity/inbox',
        item: uidsToInbox.reverse(),
    });
    await unigraph.runExecutable('$/executable/delete-item-from-list', {
        where: '$/entity/inbox',
        item: [...uidsToRemoveInbox, ...uidsToDelete],
    });
    uidsToDelete.forEach(unigraph.deleteObject);
};

await Promise.all(accounts.filter((account) => account?.uid).map(updateAccountInbox));
