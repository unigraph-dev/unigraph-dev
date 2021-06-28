import { createBrowserHistory } from "history";
import 'typeface-roboto';

import CssBaseline from '@material-ui/core/CssBaseline';
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
import { init as sm_init } from './examples/semantic/init';
import { NotesList } from './examples/notes/NotesList';
import { GraphView } from './components/ObjectView/GraphView';
import { CurrentEvents } from './examples/calendar/CurrentEvents';
import { Calendar } from './examples/calendar/Calendar';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TodayView } from "./examples/calendar/TodayView";
nb_init(); sm_init();

// TODO: custom theme
const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    height: "90vh"
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
  },
  'today': {
    'constructor': (props: any) => <TodayView {...props} />,
    'maximize': true,
    'name': "Today View"
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
  const componentPathName = (new URLSearchParams(window.location.search)).get('pageName');
  const config = getParameters(window.location.search.replace('?', ''));
  console.log(config)
  document.body.style.backgroundColor = "unset"

  return (
    <NavigationContext.Provider value={(location: string) => {history.push(location)}}>
      <div className={classes.root}>
        <DndProvider backend={HTML5Backend}>
          {componentPathName ? pages[componentPathName].constructor(config) : []}
        </DndProvider>
      </div>
    </NavigationContext.Provider>
  );
}

export default App;
