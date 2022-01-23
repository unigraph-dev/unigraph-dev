const { url } = context.params;
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

const getSemanticEntities = async (el) => {
    const children = [];
    el.entities?.media?.forEach((el) => {
        children.push({
            key: el.url || 'about:blank',
            value: unigraph.buildUnigraphEntity(el.media_url, '$/schema/icon_url'),
        });
    });
    await Promise.all(
        el.entities?.urls?.map(async (el) => {
            const url = el.unwound?.url || el.expanded_url;
            const uids = await unigraph.runExecutable('$/executable/add-bookmark', {
                url,
                context: { _hide: true },
            });
            if (uids?.[0])
                children.push({
                    key: el.url,
                    value: {
                        uid: uids[0],
                    },
                });
            else console.log(url);
        }),
    );
    return children.map((el, index) => {
        return {
            _index: { '_value.#i': index },
            _key: el.key,
            _value: {
                'dgraph.type': ['Entity'],
                type: { 'unigraph.id': '$/schema/subentity' },
                _hide: true,
                _value: el.value,
            },
        };
    });
};

const oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    appTokenKey,
    appTokenSecret,
    '1.0',
    'http://127.0.0.1:4001/callback?key=twitter',
    'HMAC-SHA1',
);

const tweetId = /.*twitter\.com\/.*\/status\/(.*)/gm.exec(url)[1];

const getTweet = async (userAccToken, userAccTokenSecret) => {
    const [err2, res, response2] = await new Promise((resolve, reject) =>
        oauth.get(
            `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&tweet_mode=extended`,
            userAccToken,
            userAccTokenSecret,
            (...ans) => resolve(ans),
        ),
    );

    const resObj = JSON.parse(res);
    const entity = {
        _updatedAt: new Date(resObj.created_at).toISOString(),
        text: {
            type: { 'unigraph.id': '$/schema/markdown' },
            _value: resObj.full_text,
        },
        from_user: {
            twitter_id: resObj.user.id_str,
            name: resObj.user.name,
            username: resObj.user.screen_name,
            description: {
                type: { 'unigraph.id': '$/schema/markdown' },
                _value: resObj.user.description || 'No description',
            },
            profile_image: resObj.user.profile_image_url_https,
        },
        twitter_id: resObj.id_str,
        children: [{ uid: '0x123' }], // prevent duplicate placehoder UIDs
    };
    const padded = unigraph.buildUnigraphEntity(entity, '$/schema/tweet');
    padded._value.children['_value['] = await getSemanticEntities(resObj);

    return padded;
};

if (account?.uid) {
    const access_token = account._value.access_token['_value.%'];
    const access_token_secret = account._value.access_token_secret['_value.%'];
    const res = await getTweet(access_token, access_token_secret);
    const uids = await unigraph.addObject(res, '$/schema/tweet', true);
    return uids[0];
}
