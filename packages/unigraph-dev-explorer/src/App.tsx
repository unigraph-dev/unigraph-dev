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
import { EmailList } from './examples/email/Email';
import { UnigraphSearch } from './components/UnigraphCore/UnigraphSearch';
import { init as nb_init } from './examples/notes/NoteBlock';
import { init as ht_init } from './examples/semantic/Html';
import { NotesList } from './examples/notes/NotesList';
import { GraphView } from './components/ObjectView/GraphView';
import { CurrentEvents } from './examples/calendar/CurrentEvents';
import { Calendar } from './examples/calendar/Calendar';
nb_init(); ht_init();

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
    'constructor': (props: any) => <DataModelPlayground {...props} />,
    'name': "DataModel Playground",
  },
  'examples/todo': {
    'constructor': (props: any) => <TodoList {...props} />,
    'name': 'Todo List',
  },
  'examples/bookmarks': {
    'constructor': (props: any) => <Bookmarks {...props} />,
    'name': 'Web Bookmarks',
  },
  'examples/rss_reader': {
    'constructor': (props: any) => <RSSReader {...props} />,
    'name': 'RSS Reader',
  },
  'request': {
    'constructor': (props: any) => <Request {...props} />,
    'name': 'Request',
  },
  'about': {
    'constructor': (props: any) => <About {...props} />,
    'name': 'About',
  },
  'email': {
    'constructor': (props: any) => <EmailList {...props} />,
    'name': 'Email',
  },
  'library': {
    'constructor': (props: any) => <UserLibraryAll {...props} />,
    'name': 'Library',
  },
  'graph': {
    'constructor': (props: any) => <GraphView {...props} />,
    'name': 'Graph View'
  },
  'settings': {
    'constructor': (props: any) => <Settings {...props} />,
    'name': 'Settings',
  },
  'package-manager': {
    'constructor': (props: any) => <PackageManager {...props} />,
    'name': 'Package Manager'
  },
  'library/object': {
    'constructor': (props: any) => <DetailedObjectView {...props} />,
    'name': 'Object View',
  },
  'schema/new': {
    'constructor': (props: any) => <AddSchema {...props} />,
    'name': 'New Schema',
  },
  'home': {
    'constructor': (props: any) => <ExplorerHome {...props} />,
    'name': 'Dashboard',
  },
  'inbox': {
    'constructor': (props: any) => <Inbox {...props} />,
    'name': 'Inbox',
  },
  'semantic/tagresults': {
    'constructor': (props: any) => <TagResults {...props} />,
    'name': 'Tag Results'
  },
  'object-editor': {
    'constructor': (props: any) => <ObjectEditor {...props} />,
    'name': 'Object Editor'
  },
  'app-library': {
    'constructor': (props: any) => <AppLibrary {...props}/>,
    'name': 'App Library'
  },
  'notification-center': {
    'constructor': (props: any) => <NotificationCenter {...props} />,
    'name': "Notification Center"
  },
  'search': {
    'constructor': (props: any) => <UnigraphSearch {...props} />,
    'name': "Search"
  },
  'notes-list': {
    'constructor': (props: any) => <NotesList {...props} />,
    'name': "Notes"
  },
  'current-events': {
    'constructor': (props: any) => <CurrentEvents {...props} />,
    'name': "Current Events"
  },
  'calendar': {
    'constructor': (props: any) => <Calendar {...props} />,
    'name': "Calendar"
  }
}

export const components: Record<string, any> = {
  'appdrawer': {
    'constructor': (props: any) => <AppDrawer {...props} />,
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
