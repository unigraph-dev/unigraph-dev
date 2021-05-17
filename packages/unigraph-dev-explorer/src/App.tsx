import React from 'react';
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

import DataModelPlayground from './pages/DataModelPlayground';
import { getParameters, NavigationContext } from './utils';
import { UserLibraryAll } from './components/UserLibrary';
import DetailedObjectView from './components/UserLibrary/UserLibraryObject';

import Settings from './pages/Settings';
import { PackageManager } from './components/PackageManager/PackageManager';
import { TagResults } from './examples/semantic/TagResults';
import { ObjectEditor } from './components/ObjectView/ObjectEditor';
import { AppLibrary } from './components/PackageManager/AppLibrary';

import { TodoList } from './examples/todo/TodoList';
import RSSReader from './examples/rss_reader';
import { Bookmarks } from './examples/bookmarks/Bookmarks';
import { NotificationCenter } from './components/UnigraphCore/Notification';
import { Inbox } from './components/UnigraphInbox/Inbox';

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

export const pages: Record<string, any> = {
  'datamodel-playground': {
    'constructor': () => <DataModelPlayground />,
    'name': "DataModel Playground",
  },
  'examples/todo': {
    'constructor': () => <TodoList />,
    'name': 'Todo List',
  },
  'examples/bookmarks': {
    'constructor': () => <Bookmarks />,
    'name': 'Web Bookmarks',
  },
  'examples/rss_reader': {
    'constructor': () => <RSSReader />,
    'name': 'RSS Reader',
  },
  'request': {
    'constructor': () => <Request />,
    'name': 'Request',
  },
  'about': {
    'constructor': () => <About />,
    'name': 'About',
  },
  'library': {
    'constructor': () => <UserLibraryAll />,
    'name': 'Library',
  },
  'settings': {
    'constructor': () => <Settings />,
    'name': 'Settings',
  },
  'package-manager': {
    'constructor': () => <PackageManager />,
    'name': 'Package Manager'
  },
  'library/object': {
    'constructor': (props: any) => <DetailedObjectView {...props} />,
    'name': 'Object View',
  },
  'schema/new': {
    'constructor': () => <AddSchema />,
    'name': 'New Schema',
  },
  'home': {
    'constructor': () => <ExplorerHome />,
    'name': 'Dashboard',
  },
  'inbox': {
    'constructor': () => <Inbox />,
    'name': 'Inbox',
  },
  'semantic/tagresults': {
    'constructor': (props: any) => <TagResults {...props} />,
    'name': 'Tag Results'
  },
  'object-editor': {
    'constructor': () => <ObjectEditor />,
    'name': 'Object Editor'
  },
  'app-library': {
    'constructor': () => <AppLibrary/>,
    'name': 'App Library'
  },
  'notification-center': {
    'constructor': () => <NotificationCenter />,
    'name': "Notification Center"
  }
}

export const components: Record<string, any> = {
  'appdrawer': {
    'constructor': () => <AppDrawer />,
  },
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

          {components['appdrawer'].constructor()}

          <main className={classes.content}>
            <div className={classes.toolbar} />
            <Switch>
              <Route path="/datamodel-playground">
                {pages['datamodel-playground'].constructor()}
              </Route>
              <Route path="/examples/todo">
                {pages['examples/todo'].constructor()}
              </Route>
              <Route path="/request">
                {pages['request'].constructor()}
              </Route>
              <Route path="/about">
                {pages['about'].constructor()}
              </Route>
              <Route 
                path="/library/object"
                render={routeProps => pages['library/object'].constructor(getParameters(routeProps.location.search))}  
              />
              <Route path="/library">
                {pages['library'].constructor()}
              </Route>
              <Route path="/schema/new">
                {pages['schema/new'].constructor()}
              </Route>
              <Route path="/">
                {pages['home'].constructor()}
              </Route>
            </Switch>
          </main>
        </Router>
      </div>
    </NavigationContext.Provider>
  );
}

export default App;
