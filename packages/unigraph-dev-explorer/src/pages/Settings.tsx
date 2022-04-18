import React from 'react';

import {
    Button,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    ListSubheader,
    MenuItem,
    Popover,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { hoverSx, pointerHoverSx, TabContext } from '../utils';

export default function Settings() {
    const [settings, setSettings] = React.useState(JSON.parse(window.localStorage.getItem('userSettings') || ''));

    const [anchorEl, setAnchorEl]: [any[], any] = React.useState([null]);
    const [activePopover, setActivePopover] = React.useState(-1);

    const devState = window.unigraph.getState('settings/developerMode');
    const [devMode, setDevMode] = React.useState(devState.value);
    devState.subscribe((newState: boolean) => setDevMode(newState));

    const analyticsState = window.unigraph.getState('settings/enableAnalytics');
    const [analyticsMode, setAnalyticsMode] = React.useState(analyticsState.value);
    analyticsState.subscribe((newState: boolean) => setAnalyticsMode(newState));
    const [email, setEmail] = React.useState(window.localStorage.getItem('email') || '');

    const tabContext = React.useContext(TabContext);
    const [settingsPage, setSettingsPage] = React.useState<any>([]);
    React.useEffect(() => {
        tabContext.subscribeToType('$/schema/settings_page', (pages: any[]) => setSettingsPage(pages));
    }, []);

    const handleClick = (event: any, n: number) => {
        const total = anchorEl;
        total[n] = event.currentTarget;
        setAnchorEl(total);
        setActivePopover(n);
    };

    const handleWindowSelection = (value: string) => {
        const newSettings = { ...settings, newWindow: value };
        setSettings(newSettings);
        window.localStorage.setItem('userSettings', JSON.stringify(newSettings));
    };

    const handleClose = () => {
        setAnchorEl([null]);
        window.localStorage.setItem('userSettings', JSON.stringify(settings));
        setActivePopover(-1);
    };

    // const id0 = Boolean(anchorEl[0]) ? 'address-popover' : undefined;
    // console.log(Boolean(anchorEl[0]))
    return (
        <div>
            <Typography variant="h4">Settings</Typography>
            <p>These setting will be stored in your browser. </p>
            <List>
                <ListSubheader component="div" id="nested-list-subheader" key="connectionsettings">
                    Connection
                </ListSubheader>
                <ListItem sx={pointerHoverSx} onClick={(e) => handleClick(e, 0)} key="connection">
                    <ListItemText primary="Server address" secondary={`Current address: ${settings.serverLocation}`} />
                </ListItem>
                <ListSubheader component="div" id="nested-list-subheader" key="window">
                    Window Management
                </ListSubheader>
                <ListItem sx={pointerHoverSx} onClick={(e) => false} key="newwindow">
                    <ListItemText
                        id="switch-list-label-new-window"
                        primary="New window options"
                        secondary="Choose the behavior when a new window is opened."
                    />
                    <ListItemSecondaryAction>
                        <Select
                            labelId="demo-simple-select-outlined-label"
                            id="demo-simple-select-outlined"
                            value={settings.newWindow ? settings.newWindow : 'new-tab'}
                            onChange={(event) => handleWindowSelection(event.target.value as string)}
                            label="new-window"
                        >
                            <MenuItem value="new-tab">Open in new tab</MenuItem>
                            <MenuItem value="new-pane">Open in new pane side by side</MenuItem>
                            <MenuItem value="new-popout">Open in new popout window</MenuItem>
                        </Select>
                    </ListItemSecondaryAction>
                </ListItem>
                <ListSubheader component="div" id="nested-list-subheader" key="analyticsHeader">
                    Analytics
                </ListSubheader>
                <ListItem
                    sx={{ ...pointerHoverSx, display: analyticsMode ? '' : 'none' }}
                    onClick={(e) => false}
                    key="analyticsOptedIn"
                >
                    <ListItemText
                        id="switch-list-label-analytics-optin-mode"
                        primary="Opt out of analytics"
                        secondary="Switch to opt out of analytics. To opt in again, enter your email below."
                    />
                    <ListItemSecondaryAction style={{ display: analyticsMode ? '' : 'none' }}>
                        <Switch
                            edge="end"
                            onChange={(e) => {
                                analyticsState.setValue(!analyticsMode);
                            }}
                            checked={analyticsMode}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-optin-analytics-mode',
                            }}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
                <ListItem sx={pointerHoverSx} onClick={(e) => false} key="analytics">
                    <ListItemText
                        id="switch-list-label-analytics-mode"
                        primary={!analyticsMode ? 'Enable analytics' : 'Update email'}
                        secondary={
                            !analyticsMode ? (
                                <span>
                                    Opt-in to analytics by clicking &quot;Opt-in&quot;. <br />
                                    Optionally, you can enter your email address before clicking to associate your
                                    analytics information with your email.
                                    <br />
                                    We will only record your usage length and basic information (OS, country).
                                </span>
                            ) : (
                                <span>
                                    Associate your analytics information with your email (optional). <br />
                                    This will allow us to understand how you use Unigraph, and contact you when things
                                    are broken.
                                </span>
                            )
                        }
                    />
                    <ListItemSecondaryAction>
                        <TextField value={email} onChange={(ev) => setEmail(ev.target.value)} />
                        <Button
                            onClick={() => {
                                analyticsState.setValue(true);
                                if (email.length > 0) {
                                    window.localStorage.setItem('email', email);
                                    (window as any).mixpanel.identify(email);
                                    (window as any).mixpanel.people.set({
                                        $name: email,
                                        $email: email,
                                    });
                                }
                            }}
                        >
                            {!analyticsMode ? 'Opt-in' : 'Update email'}
                        </Button>
                    </ListItemSecondaryAction>
                </ListItem>
                <ListSubheader component="div" id="nested-list-subheader" key="developers">
                    Developers
                </ListSubheader>
                <ListItem sx={pointerHoverSx} onClick={(e) => false} key="developermode">
                    <ListItemText
                        id="switch-list-label-developer-mode"
                        primary="Developer mode"
                        secondary="Enable utilities about Unigraph for developers."
                    />
                    <ListItemSecondaryAction>
                        <Switch
                            edge="end"
                            onChange={(e) => {
                                devState.setValue(!devMode);
                            }}
                            checked={devMode}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-developer-mode',
                            }}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
                <ListSubheader component="div" id="nested-list-subheader" key="settingsapp">
                    App Settings
                </ListSubheader>
                <ListItem
                    sx={pointerHoverSx}
                    onClick={(e) => {
                        window.wsnavigator('/settings/twitter');
                    }}
                    key="twitter"
                >
                    <ListItemText
                        id="switch-list-label-developer-mode"
                        primary="Twitter settings"
                        secondary="Connect your Twitter account to Unigraph"
                    />
                </ListItem>
                <ListItem
                    sx={pointerHoverSx}
                    onClick={(e) => {
                        window.wsnavigator('/settings/email');
                    }}
                    key="email"
                >
                    <ListItemText
                        id="switch-list-label-developer-mode"
                        primary="Email settings"
                        secondary="Connect your email inboxes to Unigraph"
                    />
                </ListItem>
                {settingsPage.map((el: any) => (
                    <ListItem
                        sx={pointerHoverSx}
                        onClick={(e) => {
                            window.wsnavigator(`/${el._value.page._value._value.view._value.uid}`);
                        }}
                        key={el.uid}
                    >
                        <ListItemText
                            primary={el.get('title').as('primitive')}
                            secondary={el.get('subtitle').as('primitive')}
                        />
                    </ListItem>
                ))}
            </List>
            <Popover
                id={JSON.stringify(activePopover)}
                open={activePopover === 0}
                anchorEl={anchorEl[0]}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <TextField
                    label="New server address:"
                    value={settings.serverLocation}
                    onChange={(event) => {
                        const newSettings = { ...settings };
                        newSettings.serverLocation = event.target.value;
                        setSettings(newSettings);
                    }}
                />
            </Popover>
        </div>
    );
}
