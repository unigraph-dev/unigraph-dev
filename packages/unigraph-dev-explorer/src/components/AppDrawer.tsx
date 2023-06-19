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
    mdiCube,
    mdiCubeOutline,
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
    <span className="text-slate-600 text-[13px] font-medium">{primary}</span>
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
        <Root style={{ height: '100%', minWidth: '240px', width: '100%' }} className="pl-0.5">
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
                    <div style={{ marginBottom: '16px' }} id="div-home">
                        <span className="font-semibold text-gray-500/80 text-xs tracking-wide pl-4">Home</span>

                        <ListItem sx={appDrawerHoverSx} className="my-1.5" onClick={() => window.wsnavigator('/home')}>
                            <Icon className="mr-2.5 text-gray-500" path={mdiHomeOutline} size={0.68} />
                            <StyledListItemText primary="Home" />
                        </ListItem>

                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/library')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiBookOpenOutline} size={0.68} />
                            <StyledListItemText primary="Library" />
                        </ListItem>

                        <ListItem sx={appDrawerHoverSx} onClick={() => window.wsnavigator('/trash')} className="my-1.5">
                            <Icon className="mr-2.5 text-gray-500" path={mdiDeleteOutline} size={0.68} />
                            <StyledListItemText primary="Trash bin" />
                        </ListItem>
                    </div>
                    <div style={{ marginBottom: '16px' }} id="div-unigraph">
                        <span className="font-semibold text-gray-500/80 text-xs tracking-wide pl-4">Unigraph</span>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/settings')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiCogOutline} size={0.68} />
                            <StyledListItemText primary="Settings" />
                        </ListItem>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/notification-center')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiBellOutline} size={0.68} />
                            <StyledListItemText primary="Notifications" />
                        </ListItem>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/package-manager')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiPackageVariantClosed} size={0.68} />
                            <StyledListItemText primary="Packages" />
                        </ListItem>
                    </div>
                    <div style={{ display: devMode ? 'inherit' : 'none', marginBottom: '16px' }} id="div-devtools">
                        <span className="font-semibold text-gray-500/80 text-xs tracking-wide pl-4">
                            Developer Tools
                        </span>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/object-editor')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiPencilBoxMultipleOutline} size={0.68} />
                            <StyledListItemText primary="Object Editor" />
                        </ListItem>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/code-editor')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiXml} size={0.68} />
                            <StyledListItemText primary="Code Editor" />
                        </ListItem>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/request')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiMessageArrowRightOutline} size={0.68} />
                            <StyledListItemText primary="Request" />
                        </ListItem>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/datamodel-playground')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiDatabaseEyeOutline} size={0.68} />
                            <StyledListItemText primary="DataModel Playground" />
                        </ListItem>
                        <ListItem
                            sx={appDrawerHoverSx}
                            onClick={() => window.wsnavigator('/ui-extension-manager')}
                            className="my-1.5"
                        >
                            <Icon className="mr-2.5 text-gray-500" path={mdiCubeSend} size={0.68} />
                            <StyledListItemText primary="UI Extension Manager" />
                        </ListItem>
                    </div>
                    <span className="font-semibold text-gray-500/80 text-xs tracking-wide pl-4">Favorites</span>
                    <div className="mb-1.5" />
                    <FavoriteBar />
                </List>
            </Drawer>
        </Root>
    );
}
