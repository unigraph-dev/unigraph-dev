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
} from '@mdi/js';
import { FavoriteBar } from './UnigraphCore/FavoriteBar';
import { hoverSx } from '../utils';

const PREFIX = 'AppDrawer';

const classes = {
    drawerPaper: `${PREFIX}-drawerPaper`,
};

const appDrawerHoverSx = { paddingBottom: '4px', paddingTop: '4px', cursor: 'pointer', ...hoverSx };
export default function DrawerRouter() {
    const devState = window.unigraph.getState('settings/developerMode');
    const [devMode, setDevMode] = React.useState(devState.value);
    devState.subscribe((newState: boolean) => setDevMode(newState));

    return (
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
                <ListSubheader component="div" id="subheader-home">
                    {' '}
                    Home{' '}
                </ListSubheader>

                <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/home')}>
                    <ListItemIcon>
                        <Icon path={mdiHomeOutline} size={1} />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItem>

                <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/library')}>
                    <ListItemIcon>
                        <Icon path={mdiBookOpenOutline} size={1} />
                    </ListItemIcon>
                    <ListItemText primary="Library" />
                </ListItem>

                <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/trash')}>
                    <ListItemIcon>
                        <Icon path={mdiDeleteOutline} size={1} />
                    </ListItemIcon>
                    <ListItemText primary="Trash bin" />
                </ListItem>
                <ListSubheader component="div" id="subheader-unigraph">
                    {' '}
                    Unigraph{' '}
                </ListSubheader>
                <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/settings')}>
                    <ListItemIcon>
                        <Icon path={mdiCogOutline} size={1} />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                </ListItem>
                <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/notification-center')}>
                    <ListItemIcon>
                        <Icon path={mdiBellOutline} size={1} />
                    </ListItemIcon>
                    <ListItemText primary="Notifications" />
                </ListItem>
                <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/package-manager')}>
                    <ListItemIcon>
                        <Icon path={mdiPackageVariantClosed} size={1} />
                    </ListItemIcon>
                    <ListItemText primary="Packages" />
                </ListItem>
                <div style={{ display: devMode ? 'inherit' : 'none' }}>
                    <ListSubheader component="div" id="subheader-developer-tools">
                        {' '}
                        Developer Tools{' '}
                    </ListSubheader>
                    <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/object-editor')}>
                        <ListItemIcon>
                            <Icon path={mdiPencilBoxMultipleOutline} size={1} />
                        </ListItemIcon>
                        <ListItemText primary="Object Editor" />
                    </ListItem>
                    <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/code-editor')}>
                        <ListItemIcon>
                            <Icon path={mdiXml} size={1} />
                        </ListItemIcon>
                        <ListItemText primary="Code Editor" />
                    </ListItem>
                    <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/request')}>
                        <ListItemIcon>
                            <Comment />
                        </ListItemIcon>
                        <ListItemText primary="Request" />
                    </ListItem>
                    <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/datamodel-playground')}>
                        <ListItemIcon>
                            <CompareArrows />
                        </ListItemIcon>
                        <ListItemText primary="DataModel Playground" />
                    </ListItem>
                </div>
                <ListSubheader component="div" id="subheader-developer-tools">
                    {' '}
                    Favorites{' '}
                </ListSubheader>
                <FavoriteBar />
            </List>
        </Drawer>
    );
}
