import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Switch, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { pkg } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { TabContext } from '../../utils';

export const shouldMirrorEmailInbox = () => window.unigraph.getState('settings/email/mirrorEmailInbox').value;
export const shouldRemoveEmailOnReadState = () => window.unigraph.getState('settings/email/removeEmailOnRead').value;

const EmailAccountView = ({ account }: { account: any }) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    const removeACcount = () => {
        window.unigraph.deleteObject(account?.uid);
        setOpen(false);
    };
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                marginLeft: '1rem',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <p>
                <strong>Name: </strong>
                {account?.get?.('name').as?.('primitive')}
            </p>
            <p>
                <strong>Username: </strong>
                {account?.get?.('username').as?.('primitive')}
            </p>
            <Button variant="outlined" onClick={handleClickOpen}>
                Remove Account
            </Button>
            <Dialog open={open} keepMounted onClose={handleClose} aria-describedby="alert-dialog-slide-description">
                <DialogTitle>Remove this account?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {`This will remove ${account?.get?.('username')}'s email account from Unigraph.`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={removeACcount}>Remove Account</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
export function EmailSettings({}) {
    const [loaded, setLoaded] = React.useState(false);
    // const [account, setAccount] = React.useState<any>({});
    const [accounts, setAccounts] = React.useState<any>([]);
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
                `(func: uid(parAcc)) @filter((NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @cascade {
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
                    // setAccount(res[0]);
                    setAccounts(res);
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
            <Typography variant="h4">Email settings</Typography>
            <Typography variant="body1">
                (we currently only support Gmail directly; for other inboxes please use the Thunderbird extension)
            </Typography>
            <Typography variant="h6">Actions</Typography>
            <p style={{ marginLeft: '1rem' }}>
                <Button
                    variant="outlined"
                    onClick={() => window.unigraph.runExecutable('$/executable/add-gmail-account', {})}
                >
                    Sign in with Google
                </Button>
            </p>

            <p style={{ marginLeft: '1rem' }}>
                <Button
                    variant="outlined"
                    onClick={() => window.unigraph.runExecutable('$/executable/gmail-full-sync', {})}
                >
                    Full sync Gmail inbox
                </Button>
                (could take a while)
            </p>
            <Typography variant="h6">Account info</Typography>
            {accounts.map((account: any) => (
                <EmailAccountView account={account} />
            ))}

            <Typography variant="h6">Options</Typography>

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
