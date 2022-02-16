import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Switch, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { pkg } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { TabContext } from '../../utils';

export const shouldMirrorEmailInbox = () => window.unigraph.getState('settings/email/mirrorEmailInbox').value;
export const shouldRemoveEmailOnReadState = () => window.unigraph.getState('settings/email/removeEmailOnRead').value;

export function EmailSettings({}) {
    const [loaded, setLoaded] = React.useState(false);
    const [account, setAccount] = React.useState<any>({});
    const tabContext = React.useContext(TabContext);

    // TODO abstract this into a react hook
    const mirrorEmailInboxState = window.unigraph.getState('settings/email/mirrorEmailInbox');
    const [mirrorEmailInbox, setEmailInboxPushMode] = React.useState(mirrorEmailInboxState.value);
    mirrorEmailInboxState.subscribe((newState: boolean) => {
        setEmailInboxPushMode(newState);
    });

    const removeEmailOnReadState = window.unigraph.getState('settings/email/removeEmailOnRead');
    const [removeEmailOnRead, setRemoveEmailOnRead] = React.useState(removeEmailOnReadState.value);
    removeEmailOnReadState.subscribe((newState: boolean) => {
        setRemoveEmailOnRead(newState);
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
                <ListItem button onClick={(e) => false} key="mirror-email-inbox">
                    <ListItemText
                        id="switch-list-label-mirror-email-inbox"
                        primary="Mirror email inbox"
                        secondary="Disabling makes it so that removing emails from Unigraph inbox doesn't remove them from gmail inbox, only sets them as read."
                    />
                    <ListItemSecondaryAction>
                        <Switch
                            edge="end"
                            onChange={(e) => {
                                mirrorEmailInboxState.setValue(!mirrorEmailInbox);
                            }}
                            checked={mirrorEmailInbox}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-mirror-email-inbox',
                            }}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
                <ListItem button onClick={(e) => false} key="remove-email-onread">
                    <ListItemText
                        id="switch-list-label-remove-email-onread"
                        primary="Remove items from Unigraph inbox on Read"
                        secondary='Not just emails, any Inbox item. If "Mirror email inbox" is enabled, will also remove emails from inbox at the origin.'
                    />
                    <ListItemSecondaryAction>
                        <Switch
                            edge="end"
                            onChange={(e) => {
                                removeEmailOnReadState.setValue(!removeEmailOnRead);
                            }}
                            checked={removeEmailOnRead}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-remove-email-onread',
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
