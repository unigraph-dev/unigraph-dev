const fs = require('fs');
const { fetch } = require('fetch-h2');

const { title, content, badge, sound, payload, liveActivity } = context.params;

// Somehow send the messages like this
const obj = await unigraph.getObject('0x1');
const user_token = liveActivity ? obj._apnsLiveActivityToken : obj._apnsToken;
const client_token_expiry = parseInt((await unigraph.getObject('0x1'))._apnsClientTokenExpiry || '0', 10);
const client_id = '78YU38573Z';
const team_id = '7KK6N32GR2';
const client_key = fs.readFileSync('/home/sophiaxu/unigraph-dev/apns_privkey.p8');

const time = new Date().getTime();
const iat = Math.floor(time / 1000.0);

// Update the client_token regardless
let client_token;
if (client_token_expiry >= new Date().getTime()) {
    // Not expired, yay!
    console.log('Not exp');
    client_token = (await unigraph.getObject('0x1'))._apnsClientToken;
} else {
    // Now we should update this...
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ iat, iss: team_id }, client_key, { algorithm: 'ES256', keyid: client_id });
    await unigraph.updateTriplets([
        `<0x1> <_apnsClientToken> "${token}" .`,
        `<0x1> <_apnsClientTokenExpiry> "${time + 1000 * 60 * 30}" .`,
    ]);
    client_token = token;
}

// Now we can finally send our notification
console.log(user_token, client_token, payload);
const res = await fetch(`https://api.sandbox.push.apple.com/3/device/${user_token}`, {
    method: 'POST',
    headers: {
        authorization: `bearer ${client_token}`,
        'apns-push-type': liveActivity ? 'liveactivity' : 'alert',
        'apns-expiration': `${iat + 1000 * 60 * 30}`,
        'apns-priority': liveActivity ? '1' : '10',
        'apns-topic': `me.thesophiaxu.Unigraph-for-iPhone${liveActivity ? '.push-type.liveactivity' : ''}`,
    },
    body: JSON.stringify(
        payload || {
            aps: { alert: { title, body: content, badge }, sound },
        },
    ),
}).catch((err) => console.log(err));
// console.log(res)
// const json = await res.json();
// console.log(json)
