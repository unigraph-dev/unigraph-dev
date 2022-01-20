const OAuth = require('oauth');

const appTokenKey = unigraph.getSecret('twitter', 'api_key');
const appTokenSecret = unigraph.getSecret('twitter', 'api_secret_key');

const account = (
    await unigraph.getQueries([
        `(func: uid(accs)) @cascade {
    uid
    type {<unigraph.id>}
    _value {
        site {
            _value {
                _value {
                    name @filter(eq(<_value.%>, "Twitter")) {
                        <_value.%>
                    }
                }
            }
        }
        name { <_value.%> }
        username { <_value.%> }
        access_token { <_value.%> }
        access_token_secret { <_value.%> }
    }
}

var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
    <~type> { accs as uid }
}`,
    ])
)?.[0]?.[0];

const oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    appTokenKey,
    appTokenSecret,
    '1.0',
    'http://127.0.0.1:4001/callback?key=twitter',
    'HMAC-SHA1',
);

const getLists = async (userAccToken, userAccTokenSecret) => {
    const [err2, lists, response2] = await new Promise((resolve, reject) =>
        oauth.get('https://api.twitter.com/1.1/lists/list.json', userAccToken, userAccTokenSecret, (...ans) =>
            resolve(ans),
        ),
    );

    const subObj = JSON.parse(lists);

    return subObj;
};

if (account?.uid) {
    const access_token = account._value.access_token['_value.%'];
    const access_token_secret = account._value.access_token_secret['_value.%'];
    const res = await getLists(access_token, access_token_secret);
    return res;
}
