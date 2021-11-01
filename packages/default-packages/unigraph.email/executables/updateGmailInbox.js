const { google } = require('googleapis');
const gmailClientId = unigraph.getSecret('google', 'client_id')
const gmailClientSecret = unigraph.getSecret('google', 'client_secret')
const fetch = require('node-fetch')

const account = (await unigraph.getQueries([`(func: uid(accs)) @cascade {
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
}`]))?.[0]?.[0];

const getQuery = (msgid) => `(func: uid(parIds)) @cascade { 
    uid
    _value {
      message_id @filter(eq(<_value.%>, "${msgid}"))
    }
}`

if (account?.uid) {
    let token = account['_value']['access_token']['_value.%'];
    let refresh = account['_value']['refresh_token']['_value.%'];

    console.log(token, refresh)

    const resp = await fetch('https://www.googleapis.com/oauth2/v4/token', {
        method: "POST",
        body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: refresh,
            client_id: gmailClientId,
            client_secret: gmailClientSecret,
        })
    })

    const accessTokenResult = await resp.json();
    if (accessTokenResult['access_token']) token = accessTokenResult['access_token'];

    await unigraph.updateObject(account.uid, {
        access_token: token,
        token_expires_in: (new Date((new Date()).getTime() + 3600 * 1000)).toISOString()
    });

    const gmail = google.gmail({
        version: "v1",
        headers: {
            Authorization: 'Bearer ' + token
        }
    })

    const res = await gmail.users.messages.list({userId: 'me', maxResults: 25});
    const messages = res.data.messages.map(el => el.id);

    const msgIdResps = await Promise.all(messages.map(id => 
        gmail.users.messages.get({userId: "me", id, format: "metadata", metadataHeaders: ['Message-Id']})));

    const msgIds = msgIdResps.map(el => el.data.payload.headers[0].value)
    console.log(msgIds)
    
    //console.log(msgIds)

    const results = (await unigraph.getQueries([...(msgIds.map(el => getQuery(el))), `var(func: eq(<unigraph.id>, "$/schema/email_message")) {
        <~type> { parIds as uid }
    }`]));
    const newMsgs = messages.filter((el, index) => results[index].length === 0);

    const newMsgResps = await Promise.all(newMsgs.map(id => 
        gmail.users.messages.get({userId: "me", id, format: "raw"})));

    if (newMsgs.length) unigraph.runExecutable('$/executable/add-email', {
        dont_check_unique: true, 
        messages: newMsgResps.map(el => {return {message: Buffer.from(el.data.raw, 'base64').toString(), read: !el.data.labelIds.includes('UNREAD')}})
    });

    // Now we can sync gmail inboxes

}

