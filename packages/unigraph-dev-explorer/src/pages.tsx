import Settings from './pages/Settings';
import { Inbox } from './components/UnigraphInbox/Inbox';
import { Bookmarks } from './examples/bookmarks/Bookmarks';
import { GraphView } from './components/ObjectView/GraphView';
import { ObjectEditor } from './components/ObjectEditor/ObjectEditor';
import { AppLibrary } from './components/PackageManager/AppLibrary';
import { PackageManager } from './components/PackageManager/PackageManager';
import { CodeEditor } from './components/UnigraphCore/CodeEditor';
import { NotificationCenter } from './components/UnigraphCore/Notification';
import { UnigraphSearch } from './components/UnigraphCore/UnigraphSearch';
import { UserLibraryAll } from './components/UserLibrary';
import DetailedObjectView from './components/UserLibrary/UserLibraryObject';
import { Calendar } from './examples/calendar/Calendar';
import { CurrentEvents } from './examples/calendar/CurrentEvents';
import { TodayView } from './examples/calendar/TodayView';
import { EmailList } from './examples/email/Email';
import { NotesList } from './examples/notes/NotesList';
import { TodoList } from './examples/todo/TodoList';
import { TwitterSettings } from './examples/twitter/TwitterSettings';
import Request from './pages/Request';
import RSSReader from './examples/rss_reader';
import DataModelPlayground from './pages/DataModelPlayground';
import ExplorerHome from './pages/ExplorerHome';
import { TrashView } from './components/UnigraphCore/TrashView';
import { Categories } from './components/UnigraphCore/Categories';
import { InspectorView } from './components/UnigraphCore/InspectorView';
import { AppDrawer } from './components';
import { ConnectionWidget } from './components/UnigraphCore/ConnectionWidget';
import { AllApps, AppLibraryWidget } from './components/PackageManager/AppLibraryWidget';
import { EmailSettings } from './examples/email/EmailSettings';
import { BacklinkView } from './components/ObjectView/BacklinkView';
import ExplorerDashboard from './pages/ExplorerDashboard';
import { SearchOverlayPopover } from './pages/SearchOverlay';
import { SubscriptionsView } from './pages/SubscriptionsView';
import { Feeds } from './components/UnigraphFeeds/Feeds';

const pages: Record<string, any> = {
    'datamodel-playground': {
        constructor: (props: any) => <DataModelPlayground {...props} />,
        name: 'DataModel Playground',
    },
    categories: {
        constructor: (props: any) => <Categories {...props} />,
        maximize: true,
        name: 'Categories',
    },
    inspector: {
        constructor: (props: any) => <InspectorView {...props} />,
        name: 'Inspector',
    },
    'examples/todo': {
        constructor: (props: any) => <TodoList {...props} />,
        maximize: true,
        name: 'Todo List',
    },
    'examples/bookmarks': {
        constructor: (props: any) => <Bookmarks {...props} />,
        name: 'Web Bookmarks',
    },
    'examples/rss_reader': {
        constructor: (props: any) => <RSSReader {...props} />,
        name: 'RSS Reader',
    },
    request: {
        constructor: (props: any) => <Request {...props} />,
        name: 'Request',
    },
    email: {
        constructor: (props: any) => <EmailList {...props} />,
        name: 'Email',
    },
    library: {
        constructor: (props: any) => <UserLibraryAll {...props} />,
        name: 'Library',
    },
    graph: {
        constructor: (props: any) => <GraphView {...props} />,
        name: 'Graph View',
    },
    trash: {
        constructor: (props: any) => <TrashView {...props} />,
        name: 'Trash Bin',
    },
    settings: {
        constructor: (props: any) => <Settings {...props} />,
        name: 'Settings',
    },
    'settings/twitter': {
        constructor: (props: any) => <TwitterSettings {...props} />,
        name: 'Twitter Settings',
    },
    'settings/email': {
        constructor: (props: any) => <EmailSettings {...props} />,
        name: 'Email Settings',
    },
    'package-manager': {
        constructor: (props: any) => <PackageManager {...props} />,
        name: 'Package Manager',
    },
    'library/object': {
        constructor: (props: any) => <DetailedObjectView {...props} />,
        icon: '_spinning-wheel',
        name: 'Object View',
    },
    'library/backlink': {
        constructor: (props: any) => <BacklinkView {...props} />,
        name: 'Backlink View',
    },
    home: {
        constructor: (props: any) => <ExplorerHome {...props} />,
        name: 'Home',
        icon: "%3Csvg xmlns='http://www.w3.org/2000/svg' style='width:24px;height:24px' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M12 5.69L17 10.19V18H15V12H9V18H7V10.19L12 5.69M12 3L2 12H5V20H11V14H13V20H19V12H22' /%3E%3C/svg%3E",
        paddingTop: false,
    },
    dashboard: {
        constructor: (props: any) => <ExplorerDashboard {...props} />,
        name: 'Dashboard',
        paddingTop: false,
    },
    inbox: {
        constructor: (props: any) => <Inbox {...props} />,
        name: 'Inbox',
    },
    feeds: {
        constructor: (props: any) => <Feeds {...props} />,
        name: 'Feeds',
    },
    'object-editor': {
        constructor: (props: any) => <ObjectEditor {...props} />,
        maximize: true,
        name: 'Object Editor',
    },
    'code-editor': {
        constructor: (props: any) => <CodeEditor {...props} />,
        name: 'Code Editor',
        maximize: true,
    },
    'subscriptions-view': {
        constructor: (props: any) => <SubscriptionsView {...props} />,
        name: 'Subscriptions view',
    },
    'app-library': {
        constructor: (props: any) => <AppLibrary {...props} />,
        name: 'App Library',
    },
    'notification-center': {
        constructor: (props: any) => <NotificationCenter {...props} />,
        name: 'Notification Center',
    },
    search: {
        constructor: (props: any) => <UnigraphSearch {...props} />,
        name: 'Search',
        paddingTop: true,
    },
    'notes-list': {
        constructor: (props: any) => <NotesList {...props} />,
        name: 'Notes',
    },
    'current-events': {
        constructor: (props: any) => <CurrentEvents {...props} />,
        name: 'Current Events',
    },
    calendar: {
        constructor: (props: any) => <Calendar {...props} />,
        name: 'Calendar',
        maximize: true,
    },
    today: {
        constructor: (props: any) => <TodayView {...props} />,
        maximize: true,
        name: 'Today View',
    },
    omnibar: {
        // only used in electron
        constructor: (props: any) => (
            <SearchOverlayPopover {...props} open setClose={() => (window as any).setClose()} noShadow />
        ),
        maximize: true,
        name: 'Omnibar',
    },
};

export const components: Record<string, any> = {
    appdrawer: {
        constructor: (props: any) => <AppDrawer {...props} />,
    },
};

export const widgets: Record<string, any> = {
    'unigraph-connection': {
        constructor: (props: any) => <ConnectionWidget {...props} />,
    },
    'recommended-apps': {
        constructor: (props: any) => <AppLibraryWidget {...props} />,
    },
    apps: {
        constructor: (props: any) => <AllApps {...props} />,
    },
};

export const initDefaultComponents = () => {
    window.unigraph.getState('registry/pages').setValue(pages);
    window.unigraph.getState('registry/components').setValue(components);
    window.unigraph.getState('registry/widgets').setValue(widgets);
};
