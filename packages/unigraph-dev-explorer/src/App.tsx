import React, { ReactElement } from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from "history";
import 'typeface-roboto';

import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { AppDrawer } from './components';
import About from './pages/About';
import ExplorerHome from './pages/ExplorerHome';
import Request from './pages/Request';
import AddSchema from './pages/AddSchema';
import TodoList from './examples/todo/TodoList';
import UserLibrary from './pages/UserLibrary';
import DataModelPlayground from './pages/DataModelPlayground';
import { NavigationContext } from './utils';

// TODO: custom theme
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

export const pages: Record<string, ReactElement> = {
  'datamodel-playground': <DataModelPlayground />,
  'examples/todo': <TodoList />,
  'request': <Request />,
  'about': <About />,
  'library': <UserLibrary />,
  'schema/new': <AddSchema />,
  'home': <ExplorerHome />
}

export const components: Record<string, ReactElement> = {
  'appdrawer': <AppDrawer />
}

function App() {
  const classes = useStyles();
  const history = createBrowserHistory();

  return (
    <NavigationContext.Provider value={(location: string) => {history.push(location)}}>
      <div className={classes.root}>
        <CssBaseline />
        <Router history={history}>
          <AppBar position="fixed" className={classes.appBar}>
            <Toolbar variant="dense">
              <Typography variant="h6" noWrap>
                unigraph-dev-explorer
              </Typography>
            </Toolbar>
          </AppBar>

          {components['appdrawer']}

          <main className={classes.content}>
            <div className={classes.toolbar} />
            <Switch>
              <Route path="/datamodel-playground">
                {pages['datamodel-playground']}
              </Route>
              <Route path="/examples/todo">
                {pages['examples/todo']}
              </Route>
              <Route path="/request">
                {pages['request']}
              </Route>
              <Route path="/about">
                {pages['about']}
              </Route>
              <Route path="/library">
                {pages['library']}
              </Route>
              <Route path="/schema/new">
                {pages['schema/new']}
              </Route>
              <Route path="/">
                {pages['home']}
              </Route>
            </Switch>
          </main>
        </Router>
      </div>
    </NavigationContext.Provider>
  );
}

export default App;
