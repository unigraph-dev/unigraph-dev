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
        subscriptions {
            <_value[> {
                _value {
                    uid
                    _value {
                        name { <_value.%> }
                        twitter_id { <_value.%> }
                        last_id_fetched { <_value.%> }
                    }
                }
            }
        }
    }
}

var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
    <~type> { accs as uid }
}`,
    ])
)?.[0]?.[0];

if (account?.uid) {
    const subscriptions = account._value.subscriptions['_value['].map((it) => {
        return {
            uid: it._value.uid,
            id: it._value._value.twitter_id['_value.%'],
            last_id_fetched: it._value._value.last_id_fetched['_value.%'],
        };
    });
    await Promise.all(
        subscriptions.map(
            async ({ uid, id, last_id_fetched }) =>
                await unigraph.runExecutable('$/executable/fetch-tweets-of-list', {
                    uid,
                    id,
                    last_id_fetched,
                    access_token: account._value.access_token['_value.%'],
                    access_token_secret: account._value.access_token_secret['_value.%'],
                }),
        ),
    );
}
