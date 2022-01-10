import { Button, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { pkg } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { TabContext } from '../../utils';

export function EmailSettings({}) {
    const [loaded, setLoaded] = React.useState(false);
    const [account, setAccount] = React.useState<any>({});
    const tabContext = React.useContext(TabContext);
    useEffectOnce(() => {
        window.unigraph.ensurePackage('unigraph.email', pkg).then(() => setLoaded(true));
    });

    useEffect(() => {
        const id = getRandomInt();
        if (loaded) {
            tabContext.subscribeToQuery(
                `(func: uid(parAcc)) @cascade {
                uid
                type @filter(eq(<unigraph.id>, "$/schema/internet_account")) {<unigraph.id>}
                _value {
                    site {
                        _value {
                            _value {
                                name @filter(eq(<_value.%>, "Google")) {
                                    <_value.%>
                                }
                            }
                        }
                    }
                    name { <_value.%> }
                    username { <_value.%> }
                }
            } var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
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
            <Typography variant="h4">
                Email settings (we currently only support Gmail directly; for other inboxes please use the Thunderbird
                extension)
            </Typography>
            <Button onClick={() => window.unigraph.runExecutable('$/executable/add-gmail-account', {})}>
                Sign in with Google
            </Button>
            <Typography variant="body1">Account info</Typography>
            <p>
                <strong>Name: </strong>
                {account?.get?.('name').as?.('primitive')}
            </p>
            <p>
                <strong>Username: </strong>
                {account?.get?.('username').as?.('primitive')}
            </p>
            <Button onClick={() => window.unigraph.runExecutable('$/executable/gmail-full-sync', {})}>
                FUll sync Gmail inbox
            </Button>
        </div>
    ) : (
        <>Loading...</>
    );
}
