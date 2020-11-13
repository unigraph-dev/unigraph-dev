import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { AppDrawer } from './components';
import About from './pages/About';
import ExplorerHome from './pages/ExplorerHome';
import unigraph from './unigraph';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    width: '100vw',
    zIndex: theme.zIndex.drawer + 1,
  },
  // necessary for content to be below app bar
  toolbar: {
    minHeight: '48px !important'
  },
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
  },
}));

function App() {
  const classes = useStyles();
  window.unigraph = unigraph("ws://localhost:3001");

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Router>
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar variant="dense">
            <Typography variant="h6" noWrap>
              unigraph-dev-explorer
            </Typography>
          </Toolbar>
        </AppBar>

        <AppDrawer />

        <main className={classes.content}>
          <div className={classes.toolbar} />
          <Switch>
            <Route path="/">
              <ExplorerHome />
            </Route>
            <Route path="/about">
              <About />
            </Route>
          </Switch>
        </main>
      </Router>
    </div>
  );
}

export default App;
