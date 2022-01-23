const fetch = require('node-fetch');

const appClientId = unigraph.getSecret('reddit', 'client_id');
const appRedirectUri = 'http%3A%2F%2F127.0.0.1%3A4001%2Fcallback%3Fkey%3Dreddit';

context.send(
    JSON.stringify({
        type: 'open_url',
        url:
            'https://www.reddit.com/api/v1/authorize?' +
            `client_id=${appClientId}&response_type=code&duration=permanent&state=jfiqjgeirjgweiperjp&redirect_uri=${appRedirectUri}&scope=edit%20identity%20history%20mysubreddits%20read%20vote`,
    }),
);

const oauthResponse = await unigraph.awaitHttpCallback('reddit');
const oauthCode = oauthResponse.query.code;

const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    body: `grant_type=authorization_code&code=${oauthCode}&redirect_uri=${appRedirectUri}`,
    headers: {
        Authorization: `Basic ${Buffer.from(`${appClientId}:`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
});
const accessTokenResult = await resp.json();
const identityRes = await fetch('https://oauth.reddit.com/api/v1/me', {
    method: 'GET',
    headers: {
        Authorization: `bearer ${accessTokenResult.access_token}`,
    },
});

const identity = await identityRes.json();

unigraph.addObject(
    {
        name: `u/${identity.name}`,
        username: identity.name,
        site: {
            name: 'Reddit',
            url: 'https://reddit.com',
            favicon: 'https://reddit.com/favicon.ico',
        },
        access_token: accessTokenResult.access_token,
        token_expires_in: new Date(new Date().getTime() + accessTokenResult.expires_in * 1000).toISOString(),
        refresh_token: accessTokenResult.refresh_token,
        subscriptions: [
            {
                type: { 'unigraph.id': '$/schema/reddit_feed' },
                name: 'Home',
                last_id_fetched: '',
            },
        ],
    },
    '$/schema/internet_account',
);
