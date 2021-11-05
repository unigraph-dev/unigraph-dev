// TODO: Use dynamic pagination based on last id fetched
// TODO: Process entities properly
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

console.log(last_id_fetched)

const getSemanticEntities = (el) => {
    const children = [];
    el.entities?.media?.forEach(el => {
        children.push({
            key: el.url || "about:blank",
            value: unigraph.buildUnigraphEntity(el.media_url, '$/schema/icon_url')
        })
    });
    el.entities?.urls?.forEach(el => {
        children.push({
            key: el.url,
            value: unigraph.buildUnigraphEntity({
                url: el.unwound?.url || el.expanded_url,
                name: el.unwound?.title || "No title",
                creative_work: {
                    abstract: {
                        type: {'unigraph.id': '$/schema/html'},
                        _value: el.unwound?.description || "No description"
                    }
                }
            }, '$/schema/web_bookmark', {globalStates: {nextUid: (children.length+1) * 1000}})
        });
        children[children.length-1].value._hide = true;
    });
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

const objects = await (new Promise((resolve, reject) => oauth.get(`https://api.twitter.com/1.1/lists/statuses.json?list_id=${id}&tweet_mode=extended&count=100&since_id=${last_id_fetched}`, access_token, access_token_secret, (err, result, response) => {
    if (!result) {
        resolve([]);
    } else {
        const resObjects = JSON.parse(result);
        const unigraphObjects = resObjects?.map?.(el => {
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
            padded['_value']['children']['_value['] = getSemanticEntities(el);
            return padded;
        }) || [];
        resolve(unigraphObjects);
    }
})))

const getQuery = (twid) => `(func: type(Entity)) @cascade { 
    uid
	type @filter(eq(<unigraph.id>, "$/schema/tweet"))
    _value {
      twitter_id @filter(eq(<_value.%>, "${twid}"))
    }
}`

console.log(objects[0], objects.length)

//const results = await unigraph.getQueries(objects.map(el => getQuery(el['_value']['twitter_id']['_value.%'])));

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
    console.log("p", context.params)
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