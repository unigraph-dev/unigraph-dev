const account = (await unigraph.getQueries([`(func: type(Entity)) @cascade {
    uid
    type @filter(eq(<unigraph.id>, "$/schema/internet_account")) {<unigraph.id>}
    _value {
        site {
            _value {
                _value {
                    name @filter(eq(<_value.%>, "Reddit")) {
                        <_value.%>
                    }
                }
            }
        }
        access_token { <_value.%> }
        token_expires_in { <_value.%dt> }
        refresh_token { <_value.%> }
        subscriptions {
            <_value[> {
                _value {
                    uid
                    _value {
                        name { <_value.%> }
                        last_id_fetched { <_value.%> }
                    }
                }
            }
        }
    }
}`]))?.[0]?.[0];

if (account?.uid) {
    // Check if access token is expired
    let token = account['_value']['access_token']['_value.%'];
    const lastFetched = account['_value']['subscriptions']['_value['][0]['_value']['_value']['last_id_fetched']['_value.%']
    const beforeObj = "" //lastFetched.length ? "&before="+lastFetched : ""
    const fetch = require('node-fetch')
    if (true) {
        const appClientId = unigraph.getSecret("reddit", "client_id");
        const resp = await fetch("https://www.reddit.com/api/v1/access_token", {
            method: 'POST', 
            body: `grant_type=refresh_token&refresh_token=${account['_value']['refresh_token']['_value.%']}`,
            headers: {
                'Authorization': `Basic ${Buffer.from(appClientId + ":").toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }});
        const accessTokenResult = await resp.json();
        token = accessTokenResult['access_token'];
        await unigraph.updateObject(account.uid, {
            access_token: token,
            token_expires_in: (new Date((new Date()).getTime() + 3600 * 1000)).toISOString()
        });
    }
    // TODO: update reddit subscriptions
    const subs = await fetch("https://oauth.reddit.com/?limit=30" + beforeObj, {
        headers: {
            'Authorization': 'bearer ' + token
        }
    });
    const subJson = await subs.json();
    const updatedObjs = subJson.data.children.map(el => el.data).map(el => {
        return {
            _timestamp: {
                _updatedAt: (new Date(el['created'] * 1000)).toISOString()
            },
            name: {
                type: {"unigraph.id": "$/schema/markdown"},
                _value: el['title']
            },
            selftext: {
                type: {"unigraph.id": "$/schema/markdown"},
                _value: el['selftext']
            },
            ...(el['thumbnail'] ? {thumbnail:  el['thumbnail']} : {}),
            subreddit: {
                name: el['subreddit']   
            },
            permalink: 'https://reddit.com' + el['permalink'],
            url: el['url'],
            id: el['name']
        }
    });
    // Add these items to Unigraph
    const getQuery = (id) => `(func: type(Entity)) @cascade { 
        uid
        type @filter(eq(<unigraph.id>, "$/schema/reddit_post"))
        _value {
          id @filter(eq(<_value.%>, "${id}"))
        }
    }`

    const results = await unigraph.getQueries(updatedObjs.map(el => getQuery(el.id)));

    let inbox_els = []
    let count = 0

    for (let i=0; i<updatedObjs.length; ++i) {
        if (results[i].length === 0) {
            const uid = await unigraph.addObject(updatedObjs[i], '$/schema/reddit_post');
            inbox_els.push(uid[0]);
        }
    }

    if (updatedObjs?.[0]?.['id']) {
        await unigraph.updateObject(account['_value']['subscriptions']['_value['][0]['_value']['uid'], {
            _value: {
                last_id_fetched: {
                    "_value.%": updatedObjs[0]['id']
                }
            }
        }, true, false)
    }

    console.log("Updated items: " + inbox_els.length)

    await unigraph.runExecutable("$/executable/add-item-to-list", {where: "$/entity/inbox", item: inbox_els.reverse()});
}