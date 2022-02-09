import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Switch, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { pkg } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { TabContext } from '../../utils';

export const isInboxPushModeSoft = () => window.unigraph.getState('settings/email/emailSoftInboxPushMode').value;

export function EmailSettings({}) {
    const [loaded, setLoaded] = React.useState(false);
    const [account, setAccount] = React.useState<any>({});
    const tabContext = React.useContext(TabContext);

    const emailSoftInboxPushModeState = window.unigraph.getState('settings/email/emailSoftInboxPushMode');
    const [emailSoftInboxPushMode, setEmailInboxPushMode] = React.useState(emailSoftInboxPushModeState.value);
    emailSoftInboxPushModeState.subscribe((newState: boolean) => {
        setEmailInboxPushMode(newState);
    });

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
            <List>
                <ListItem button onClick={(e) => false} key="email-inbox-push-mode">
                    <ListItemText
                        id="switch-list-label-email-soft-inbox-push-mode"
                        primary="Email Soft Inbox Push Mode"
                        secondary="Enable soft inbox push mode. (Removing from Unigraph Inbox marks email as read at origin, reading in Unigraph has no effect)"
                    />
                    <ListItemSecondaryAction>
                        <Switch
                            edge="end"
                            onChange={(e) => {
                                emailSoftInboxPushModeState.setValue(!emailSoftInboxPushMode);
                            }}
                            checked={emailSoftInboxPushMode}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-email-soft-inbox-push-mode',
                            }}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
            </List>
        </div>
    ) : (
        <>Loading...</>
    );
}
