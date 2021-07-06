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

const objects = await (new Promise((resolve, reject) => oauth.get(`https://api.twitter.com/1.1/lists/statuses.json?list_id=${id}&tweet_mode=extended&count=100&since_id=${last_id_fetched}`, access_token, access_token_secret, (err, result, response) => {
    if (!result) {
        resolve([]);
    } else {
        const resObjects = JSON.parse(result);
        const unigraphObjects = resObjects?.map(el => {if (el.truncated) console.log("Truncated"); return {
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
            twitter_id: el['id_str']
        }});
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

const results = await unigraph.getQueries(objects.map(el => getQuery(el.twitter_id)));

let inbox_els = []
let count = 0

for (let i=0; i<objects.length; ++i) {
    if (results[i].length === 0) {
        count ++;
        const uid = await unigraph.addObject(objects[i], '$/schema/tweet');
        inbox_els.push(uid[0]);
    }
}

if (objects?.[0]?.['twitter_id']) {
    console.log("p", context.params)
    await unigraph.updateObject(uid, {
        _value: {
            last_id_fetched: {
                "_value.%": objects[0]['twitter_id']
            }
        }
    }, true, false)
}

await unigraph.runExecutable("$/executable/add-item-to-list", {where: "$/entity/inbox", item: inbox_els.reverse()});
//setTimeout(() => unigraph.addNotification({name: "Tweets added", from: "unigraph.twitter", content: "Added " + count + " items.", actions: []}), 1000); 