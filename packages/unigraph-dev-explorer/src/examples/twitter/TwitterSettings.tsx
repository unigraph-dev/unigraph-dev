/* eslint-disable react/no-unescaped-entities */
import { Button, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { pkg as twitterPackage } from 'unigraph-dev-common/lib/data/unigraph.twitter.pkg';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { TabContext } from '../../utils';

export function TwitterSettings() {
    const [loaded, setLoaded] = React.useState(false);
    const [lists, setLists] = React.useState([]);
    const [account, setAccount] = React.useState<any>({});
    const subscriptions = account?._value?.subscriptions['_value['].map((it: any) => ({
        uid: it._value.uid,
        name: it._value._value.name['_value.%'],
        last_id_fetched: it._value._value.last_id_fetched['_value.%'],
    }));
    const tabContext = React.useContext(TabContext);
    useEffectOnce(() => {
        window.unigraph.ensurePackage('unigraph.twitter', twitterPackage).then(() => setLoaded(true));
    });

    React.useEffect(() => {
        if (account?.uid) {
            window.unigraph.runExecutable('$/executable/get-twitter-lists', {}).then(setLists);
        }
    }, [account]);

    useEffect(() => {
        const id = getRandomInt();
        if (loaded) {
            tabContext.subscribeToQuery(
                `(func: uid(parTwitter)) {
                uid
                _value {
                        site {
                            _value {
                                _value {
                                    name {
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
            
            parTwitter as var(func: uid(parAcc)) @cascade {
                uid
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
                }
            }

            var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
                <~type> { parAcc as uid }
            }`,
                (res: any[]) => {
                    setAccount(res[0]);
                },
                id,
                { noExpand: true },
            );
        }
        return function cleanup() {
            tabContext.unsubscribe(id);
        };
    }, [loaded]);

    return loaded ? (
        <div>
            <Typography variant="h4">Twitter settings</Typography>
            <Button onClick={() => window.unigraph.runExecutable('$/executable/add-twitter-account', {})}>
                Sign in with Twitter
            </Button>
            <Typography>
                Note: for now, in order to sync with Twitter, you need to create a twitter list nameed 'Subscription'
                (exactly) and add any accounts you want to sync to unigraph there.
            </Typography>
            <Typography variant="body1">Account info</Typography>
            <p>
                <strong>Name: </strong>
                {account?.get?.('name').as?.('primitive')}
            </p>
            <p>
                <strong>Username: </strong>
                {account?.get?.('username').as?.('primitive')}
            </p>
            <Typography variant="body1">Currently subscribed to</Typography>
            {subscriptions?.map((el: any) => (
                <p>
                    <strong>{el.name}</strong>
                    {el.last_id_fetched}
                </p>
            ))}
            Add a list:
            {lists?.map((el: any) => (
                <p>
                    {el.name}
                    <strong
                        onClick={() => {
                            window.unigraph.updateObject(account.uid, {
                                subscriptions: [
                                    {
                                        type: {
                                            'unigraph.id': '$/schema/twitter_list',
                                        },
                                        twitter_id: el?.id_str,
                                        name: el?.name,
                                        // description: subObj?.description,
                                        last_id_fetched: '1',
                                    },
                                ],
                            });
                        }}
                    >
                        Add
                    </strong>
                </p>
            ))}
        </div>
    ) : (
        <>Loading...</>
    );
}
