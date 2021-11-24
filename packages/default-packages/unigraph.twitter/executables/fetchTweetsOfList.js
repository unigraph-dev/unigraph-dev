// TODO: Use twitter-like UX in views (RT, reply, etc) + include RTs
const {uid, access_token, access_token_secret, id, last_id_fetched} = context.params;
const OAuth = require('oauth');
const appTokenKey = unigraph.getSecret("twitter", "api_key");
const appTokenSecret = unigraph.getSecret("twitter", "api_secret_key");

const oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    appTokenKey,
    appTokenSecret,
    '1.0',
    'http://127.0.0.1:4001/callback?key=twitter',
    'HMAC-SHA1'
);

const getSemanticEntities = async (el) => {
    const children = [];
    el.entities?.media?.forEach(el => {
        children.push({
            key: el.url || "about:blank",
            value: unigraph.buildUnigraphEntity(el.media_url, '$/schema/icon_url')
        })
    });
    await Promise.all(el.entities?.urls?.map(async el => {
        const url = el.unwound?.url || el.expanded_url;
        const uids = await unigraph.runExecutable('$/executable/add-bookmark', {url: url, context: {_hide: true}});
        if (uids?.[0]) children.push({
            key: el.url,
            value: {
                uid: uids[0]
            }
        }); else console.log(url);
    }));
    return children.map((el, index) => {return {
            '_index': {'_value.#i': index},
            '_key': el.key,
            '_value': {
                'dgraph.type': ['Entity'],
                'type': {'unigraph.id': '$/schema/subentity'},
                '_hide': true,
                '_value': el.value
            }
    }});
}

const objects = await (new Promise((resolve, reject) => oauth.get(`https://api.twitter.com/1.1/lists/statuses.json?list_id=${id}&tweet_mode=extended&count=100&since_id=${last_id_fetched}`, access_token, access_token_secret, async (err, result, response) => {
    if (!result) {
        resolve([]);
    } else {
        const resObjects = JSON.parse(result);
        const unigraphObjects = await Promise.all(resObjects?.map?.(async el => {
            if (el.truncated) console.log("Truncated"); 
            const entity = {
                _timestamp: {
                    _updatedAt: (new Date(el['created_at'])).toISOString()
                },
                text: {
                    type: {"unigraph.id": "$/schema/markdown"},
                    _value: el['full_text']
                },
                from_user: {
                    twitter_id: el.user['id_str'],
                    name: el.user['name'],
                    username: el.user['screen_name'],
                    description: {
                        type: {"unigraph.id": "$/schema/markdown"},
                        _value: el.user['description'] || "No description"
                    },
                    profile_image: el.user['profile_image_url_https']
                },
                twitter_id: el['id_str'],
                children: [{uid: "0x123"}]
            };
            const padded = unigraph.buildUnigraphEntity(entity, '$/schema/tweet');
            padded['_value']['children']['_value['] = await getSemanticEntities(el);
            return padded;
        })) || [];
        resolve(unigraphObjects);
    }
})))

let inbox_els = []
let count = 0

for (let i=0; i<objects.length; ++i) {
    if (true /*results[i].length === 0*/) {
        count ++;
        const uid = await unigraph.addObject(objects[i], '$/schema/tweet', true);
        inbox_els.push(uid[0]);
    }
}

if (objects?.[0]?.['_value']?.['twitter_id']?.['_value.%']) {
    await unigraph.updateObject(uid, {
        _value: {
            last_id_fetched: {
                "_value.%": objects[0]['_value']['twitter_id']['_value.%']
            }
        }
    }, true, false)
}

await unigraph.runExecutable("$/executable/add-item-to-list", {where: "$/entity/inbox", item: inbox_els.reverse()});
//setTimeout(() => unigraph.addNotification({name: "Tweets added", from: "unigraph.twitter", content: "Added " + count + " items.", actions: []}), 1000); 