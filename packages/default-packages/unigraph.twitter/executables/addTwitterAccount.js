const OAuth = require('oauth');

const appTokenKey = unigraph.getSecret('twitter', 'api_key');
const appTokenSecret = unigraph.getSecret('twitter', 'api_secret_key');

const oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    appTokenKey,
    appTokenSecret,
    '1.0',
    'http://127.0.0.1:4001/callback?key=twitter',
    'HMAC-SHA1',
);

const addAccount = async (userAccToken, userAccTokenSecret) => {
    const [err, userDetails, response] = await new Promise((resolve, reject) =>
        oauth.get(
            'https://api.twitter.com/1.1/account/verify_credentials.json',
            userAccToken,
            userAccTokenSecret,
            (...ans) => resolve(ans),
        ),
    );
    const [err2, lists, response2] = await new Promise((resolve, reject) =>
        oauth.get('https://api.twitter.com/1.1/lists/list.json', userAccToken, userAccTokenSecret, (...ans) =>
            resolve(ans),
        ),
    );

    const details = JSON.parse(userDetails);
    const subObj = JSON.parse(lists).filter?.((el) => el.name === 'Subscriptions')?.[0];

    const account = {
        name: details.name,
        site: {
            name: 'Twitter',
            url: 'https://twitter.com',
            favicon: 'https://twitter.com/favicon.ico',
        },
        username: details.screen_name,
        access_token: userAccToken,
        access_token_secret: userAccTokenSecret,
        subscriptions: subObj
            ? [
                  {
                      type: { 'unigraph.id': '$/schema/twitter_list' },
                      twitter_id: subObj?.id_str,
                      name: subObj?.name,
                      // description: subObj?.description,
                      last_id_fetched: '1',
                  },
              ]
            : [],
    };
    // console.log(account)
    unigraph.addObject(account, '$/schema/internet_account');
};

oauth.getOAuthRequestToken(async (err, OAuthToken, OAuthTokenSecret, results) => {
    const oAuthTokenSecret = OAuthTokenSecret;
    const oauthUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${OAuthToken}`;
    context.send(JSON.stringify({ type: 'open_url', url: oauthUrl }));

    const oauthResponse = await unigraph.awaitHttpCallback('twitter');
    if (oauthResponse.query.oauth_token && oauthResponse.query.oauth_verifier)
        oauth.getOAuthAccessToken(
            oauthResponse.query.oauth_token,
            oAuthTokenSecret,
            oauthResponse.query.oauth_verifier,
            (err, oAuthAccessToken, oAuthAccessTokenSecret, results) => {
                addAccount(oAuthAccessToken, oAuthAccessTokenSecret);
            },
        );
});
