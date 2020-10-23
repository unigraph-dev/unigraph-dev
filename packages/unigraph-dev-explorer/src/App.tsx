import React from 'react';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import About from './components/About';
import { Home, Info } from '@material-ui/icons';
import ExplorerHome from './components/ExplorerHome';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(3),
    },
  }),
);

function DrawerRouter() {
  const classes = useStyles();
  return <Drawer
    className={classes.drawer}
    variant="permanent"
    classes={{
      paper: classes.drawerPaper,
    }}
    anchor="left"
  >
    <div className={classes.toolbar} />
    <Divider />
    <List>
      <ListItem button key="home" component={Link} to="/">
        <ListItemIcon><Home/></ListItemIcon>
        <ListItemText primary="Home" />
      </ListItem>
      <ListItem button key="about" component={Link} to="/about">
        <ListItemIcon><Info/></ListItemIcon>
        <ListItemText primary="About" />
      </ListItem>
    </List>
  </Drawer>
}

// @ts-ignore
window.backendConnection = new WebSocket("ws://localhost:3001"); window.backendMessages = []


function AppLayout() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Router>
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <Typography variant="h6" noWrap>
              unigraph-dev-explorer
            </Typography>
          </Toolbar>
        </AppBar>

        <DrawerRouter/>

        <main className={classes.content}>
          <div className={classes.toolbar} />
            <Switch>
              <Route path="/about"><About/></Route>
              <Route path="/"><ExplorerHome/></Route>
            </Switch>

        </main>
      </Router>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <AppLayout/>
    </div>
  );
}

export default App;
