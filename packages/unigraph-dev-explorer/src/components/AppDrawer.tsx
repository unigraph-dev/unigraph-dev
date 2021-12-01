import React from 'react';

import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import { Comment, CompareArrows } from '@material-ui/icons';
import { ListSubheader } from '@material-ui/core';
import { NavigationContext } from '../utils';
import { FavoriteBar } from './UnigraphCore/FavoriteBar';

import Icon from '@mdi/react'
import { mdiViewDashboardOutline, mdiBookOpenOutline, mdiPencilBoxMultipleOutline, mdiXml, mdiPackageVariantClosed, mdiDeleteOutline, mdiCogOutline, mdiBellOutline, mdiHomeOutline } from '@mdi/js';

const useStyles = makeStyles(theme => ({
  drawer: {
    width: "100%",
    flexShrink: 0,
  },
  drawerPaper: {
    width: "100%",
    border: "none",
  },
}));

export default function DrawerRouter() {
  const classes = useStyles();

  const devState = window.unigraph.getState('settings/developerMode');
  const [devMode, setDevMode] = React.useState(devState.value);
  devState.subscribe((newState: boolean) => setDevMode(newState));

  return (
    <NavigationContext.Consumer>
        { (navigator: any) => <Drawer
          className={classes.drawer}
          variant="permanent"
          classes={{
            paper: classes.drawerPaper,
          }}
          anchor="left"
        >
          <List>
            <ListSubheader component="div" id="subheader-home"> Home </ListSubheader>

            <ListItem button onClick={()=>navigator('/home')}>
              <ListItemIcon><Icon path={mdiHomeOutline} size={1}/></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            
            <ListItem button onClick={()=>navigator('/library')}>
              <ListItemIcon><Icon path={mdiBookOpenOutline} size={1}/></ListItemIcon>
              <ListItemText primary="Library" />
            </ListItem>
            
            <ListItem button onClick={()=>navigator('/object-editor')}>
              <ListItemIcon><Icon path={mdiPencilBoxMultipleOutline} size={1}/></ListItemIcon>
              <ListItemText primary="Object Editor" />
            </ListItem>
            
            <ListItem button onClick={()=>navigator('/trash')}>
              <ListItemIcon><Icon path={mdiDeleteOutline} size={1}/></ListItemIcon>
              <ListItemText primary="Trash bin" />
            </ListItem>
            <ListSubheader component="div" id="subheader-unigraph"> Unigraph </ListSubheader>
            <ListItem button onClick={()=>navigator('/settings')}>
              <ListItemIcon><Icon path={mdiCogOutline} size={1}/></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <ListItem button onClick={()=>navigator('/notification-center')}>
              <ListItemIcon><Icon path={mdiBellOutline} size={1}/></ListItemIcon>
              <ListItemText primary="Notifications" />
            </ListItem>
            <ListItem button onClick={()=>navigator('/package-manager')}>
              <ListItemIcon><Icon path={mdiPackageVariantClosed} size={1}/></ListItemIcon>
              <ListItemText primary="Packages" />
            </ListItem>
            <div style={{display: devMode ? "inherit" : "none"}}>
              <ListSubheader component="div" id="subheader-developer-tools"> Developer Tools </ListSubheader>
              <ListItem button onClick={()=>navigator('/code-editor')}>
              <ListItemIcon><Icon path={mdiXml} size={1}/></ListItemIcon>
              <ListItemText primary="Code Editor" />
            </ListItem>
              <ListItem button onClick={()=>navigator('/request')}>
                <ListItemIcon><Comment /></ListItemIcon>
                <ListItemText primary="Request" />
              </ListItem>
              <ListItem button onClick={()=>navigator('/datamodel-playground')}>
                <ListItemIcon><CompareArrows /></ListItemIcon>
                <ListItemText primary="DataModel Playground" />
              </ListItem>
            </div>
            <ListSubheader component="div" id="subheader-developer-tools"> Favorites </ListSubheader>
            <FavoriteBar/>
          </List>
        </Drawer>}
    </NavigationContext.Consumer>
    
  );
}