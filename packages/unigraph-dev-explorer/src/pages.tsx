import Settings from './pages/Settings';
import { Inbox } from './components/UnigraphInbox/Inbox';
import { Bookmarks } from './examples/bookmarks/Bookmarks';
import { GraphView } from "./components/ObjectView/GraphView";
import { ObjectEditor } from "./components/ObjectView/ObjectEditor";
import { AppLibrary } from "./components/PackageManager/AppLibrary";
import { PackageManager } from "./components/PackageManager/PackageManager";
import { CodeEditor } from "./components/UnigraphCore/CodeEditor";
import { NotificationCenter } from "./components/UnigraphCore/Notification";
import { UnigraphSearch } from "./components/UnigraphCore/UnigraphSearch";
import { UserLibraryAll } from "./components/UserLibrary";
import DetailedObjectView from "./components/UserLibrary/UserLibraryObject";
import { Calendar } from "./examples/calendar/Calendar";
import { CurrentEvents } from "./examples/calendar/CurrentEvents";
import { TodayView } from "./examples/calendar/TodayView";
import { EmailList } from "./examples/email/Email";
import { NotesList } from "./examples/notes/NotesList";
import { TodoList } from "./examples/todo/TodoList";
import { TwitterSettings } from "./examples/twitter/TwitterSettings";
import Request from './pages/Request';
import RSSReader from './examples/rss_reader';
import About from "./pages/About";
import AddSchema from "./pages/AddSchema";
import DataModelPlayground from "./pages/DataModelPlayground";
import ExplorerHome from "./pages/ExplorerHome";
import { TrashView } from './components/UnigraphCore/TrashView';

const pages: Record<string, any> = {
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
    "trash": {
      'constructor': (props: any) => <TrashView {...props} />,
      'name': 'Trash Bin'
    },
    'settings': {
      'constructor': (props: any) => <Settings {...props} />,
      'name': 'Settings',
    },
    'settings/twitter': {
      'constructor': (props: any) => <TwitterSettings {...props} />,
      'name': 'Twitter Settings',
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
    'object-editor': {
      'constructor': (props: any) => <ObjectEditor {...props} />,
      'name': 'Object Editor'
    },
    'code-editor': {
      'constructor': (props: any) => <CodeEditor {...props} />,
      'name': "Code Editor",
      'maximize': true
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

window.unigraph.getState('registry/pages').setValue(pages);