import React from 'react';

import { styled } from '@mui/material/styles';

import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Comment, CompareArrows } from '@mui/icons-material';
import { ListSubheader } from '@mui/material';
import Icon from '@mdi/react';
import {
    mdiBookOpenOutline,
    mdiPencilBoxMultipleOutline,
    mdiXml,
    mdiPackageVariantClosed,
    mdiDeleteOutline,
    mdiCogOutline,
    mdiBellOutline,
    mdiHomeOutline,
    mdiMessageArrowRightOutline,
    mdiDatabaseEyeOutline,
    mdiCubeSend,
} from '@mdi/js';
import { FavoriteBar } from './UnigraphCore/FavoriteBar';
import { pointerHoverSx } from '../utils';

const StyledListItemIcon = styled(ListItemIcon)({
    minWidth: '20px',
    maxWidth: '20px',
    minHeight: '20px',
    maxHeight: '20px',
    marginRight: '18px',
    alignItems: 'center',
});

const StyledListItemText = ({ primary }: any) => (
    <ListItemText
        primary={primary}
        primaryTypographyProps={{ style: { fontSize: '.875rem', letterSpacing: '.2px' } }}
    />
);

const StyledListSubheader = styled(ListSubheader)({
    lineHeight: '36px',
    textTransform: 'uppercase',
    fontSize: '12px',
    letterSpacing: '0.03em',
    fontWeight: 600,
    background: 'transparent',
});

const PREFIX = 'AppDrawer';

const classes = {
    drawerPaper: `${PREFIX}-drawerPaper`,
};

const Root = styled('div')(({ theme }) => ({
    [`& .${classes.drawerPaper}`]: {
        borderRight: 'none',
        backgroundColor: 'var(--app-drawer-background-color)',
        transition: 'background-color 0.3s linear',
    },
}));

const appDrawerHoverSx = { paddingBottom: '2px', paddingTop: '2px', ...pointerHoverSx };
export default function DrawerRouter() {
    const devState = window.unigraph.getState('settings/developerMode');
    const [devMode, setDevMode] = React.useState(devState.value);
    devState.subscribe((newState: boolean) => setDevMode(newState));

    return (
        <Root style={{ height: '100%', width: '240px' }}>
            <Drawer
                variant="permanent"
                classes={{
                    paper: classes.drawerPaper,
                }}
                anchor="left"
                sx={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    flexShrink: 0,
                }}
            >
                <List>
                    <div style={{ marginBottom: '12px' }} id="div-home">
                        <StyledListSubheader id="subheader-home"> HOME </StyledListSubheader>

                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/home')}>
                            <StyledListItemIcon>
                                <Icon path={mdiHomeOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Home" />
                        </ListItem>

                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/library')}>
                            <StyledListItemIcon>
                                <Icon path={mdiBookOpenOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Library" />
                        </ListItem>

                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/trash')}>
                            <StyledListItemIcon>
                                <Icon path={mdiDeleteOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Trash bin" />
                        </ListItem>
                    </div>
                    <div style={{ marginBottom: '12px' }} id="div-unigraph">
                        <StyledListSubheader id="subheader-unigraph"> UNIGRAPH </StyledListSubheader>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/settings')}>
                            <StyledListItemIcon>
                                <Icon path={mdiCogOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Settings" />
                        </ListItem>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/notification-center')}>
                            <StyledListItemIcon>
                                <Icon path={mdiBellOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Notifications" />
                        </ListItem>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/package-manager')}>
                            <StyledListItemIcon>
                                <Icon path={mdiPackageVariantClosed} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Packages" />
                        </ListItem>
                    </div>
                    <div style={{ display: devMode ? 'inherit' : 'none', marginBottom: '12px' }} id="div-devtools">
                        <StyledListSubheader id="subheader-developer-tools"> DEVELOPER TOOLS </StyledListSubheader>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/object-editor')}>
                            <StyledListItemIcon>
                                <Icon path={mdiPencilBoxMultipleOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Object Editor" />
                        </ListItem>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/code-editor')}>
                            <StyledListItemIcon>
                                <Icon path={mdiXml} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Code Editor" />
                        </ListItem>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/request')}>
                            <StyledListItemIcon>
                                <Icon path={mdiMessageArrowRightOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="Request" />
                        </ListItem>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/datamodel-playground')}>
                            <StyledListItemIcon>
                                <Icon path={mdiDatabaseEyeOutline} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="DataModel Playground" />
                        </ListItem>
                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/ui-extension-manager')}>
                            <StyledListItemIcon>
                                <Icon path={mdiCubeSend} size={1} />
                            </StyledListItemIcon>
                            <StyledListItemText primary="UI Extension Manager" />
                        </ListItem>
                    </div>
                    <StyledListSubheader id="subheader-developer-tools"> FAVORITES </StyledListSubheader>
                    <FavoriteBar />
                </List>
            </Drawer>
        </Root>
    );
}
