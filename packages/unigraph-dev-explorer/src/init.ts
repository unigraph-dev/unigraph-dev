/* eslint-disable @typescript-eslint/no-var-requires */
import { unigraph } from 'unigraph-dev-common';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { isJsonString, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import _ from 'lodash';
import DragSelect from 'dragselect';
import { ViewViewDetailed } from './components/ObjectView/DefaultObjectView';
import { BasicPersonView, DefaultSkeleton } from './components/ObjectView/BasicObjectViews';
import { CodeOrComponentView, Executable } from './components/ObjectView/ExecutableView';
import { ANotification, Notification as CNotification } from './components/UnigraphCore/Notification';
import { UserSettings } from './global.d';

import { init as nbInit } from './examples/notes/init';
import { init as smInit } from './examples/semantic/init';
import { init as clInit } from './examples/calendar/init';
import { init as twInit } from './examples/twitter/Tweet';
import { init as reInit } from './examples/reddit/RedditPost';
import { init as bmInit } from './examples/bookmarks/Bookmarks';
import { init as emInit } from './examples/email/Email';
import { init as tdInit } from './examples/todo/TodoList';
import { init as rssInit } from './examples/rss_reader/RSSFeeds';
import { init as pbInit } from './components/UnigraphCore/Pinboard';

import { ListObjectQuery, ListObjectView } from './components/UnigraphCore/ListObjectView';
import { SubentityView } from './components/UnigraphCore/SubentityView';
import { ViewItem } from './components/ObjectView/ViewObjectView';
import { backlinkQuery } from './components/ObjectView/backlinksUtils';
import { MiniListView } from './components/UnigraphCore/ListsList';
import { getParents, isMobile, isMultiSelectKeyPressed } from './utils';
import { PackageManifestView } from './components/PackageManager/PackageManager';
import { initKeyboardShortcuts } from './keyboardShortcuts';

window.reloadCommands = () => {
    const commandsState = window.unigraph.getState('registry/commands');

    const pageCommands = Object.entries(window.unigraph.getState('registry/pages').value).map(([k, v]: any) => ({
        name: `Open: ${v.name}`,
        about: `Open the page ${v.name}`,
        onClick: (ev: any, setInput: any, setClose: any) => {
            window.wsnavigator(`/${k}`);
            setInput('');
            setClose();
        },
    }));

    const adderCommands = Object.entries(window.unigraph.getState('registry/quickAdder').value)
        .map(([k, v]: any) => {
            if ((v.alias || []).includes(k)) return false;
            const matches = [k, ...(v.alias || [])].map((el: string) => `+${el}`).join(' / ');
            return {
                name: `${matches}: ${v.description}`,
                about: 'Add a Unigraph object',
                onClick: (ev: any, setInput: any) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    setInput(`+${k} `);
                },
                group: 'adder',
            };
        })
        .filter(Boolean);

    const searchCommand = {
        name: '?<search query> : search Unigraph',
        about: 'Search Unigraph',
        onClick: (ev: any, setInput: any) => {
            ev.stopPropagation();
            ev.preventDefault();
            setInput('?');
        },
        group: 'search',
    };

    commandsState.setValue([...adderCommands, searchCommand, ...pageCommands]);
};

/**
 * Things to do when Unigraph explorer loads
 */
export function init(hostname?: string) {
    console.log('initialized!');
    const hst = hostname || (window.location.hostname.length ? window.location.hostname : 'localhost');
    const browserId = `${getRandomInt()}${getRandomInt()}`;

    const defaultSettings: UserSettings = {
        serverLocation: `ws://${hst}:3001`,
        newWindow: 'new-tab',
        nativeNotifications: true,
        developerMode: false,
        browserId,
    };

    let userSettings = defaultSettings;

    if (!isJsonString(window.localStorage.getItem('userSettings'))) {
        window.localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    } else {
        userSettings = JSON.parse(window.localStorage.getItem('userSettings') || '');
    }

    // Connect to Unigraph
    window.unigraph = unigraph(userSettings.serverLocation, userSettings.browserId);

    const nfState = window.unigraph.addState('notification-center/notifications', []);
    nfState.subscribe((el: any[]) => {
        el = [...el].pop();
        const unpadded: ANotification = unpad(el);
        const updated = new Date(unpadded?._updatedAt);
        const current = new Date();
        if (current.valueOf() - updated.valueOf() < 5000 && Notification && !isMobile()) {
            // eslint-disable-next-line no-new
            new Notification(unpadded.name, {
                body: `${unpadded.from}: ${unpadded.content}`,
            });
        }
    });

    const devState = window.unigraph.addState('settings/developerMode', userSettings.developerMode);
    devState.subscribe((val: boolean) => {
        window.localStorage.setItem(
            'userSettings',
            JSON.stringify({
                ...JSON.parse(window.localStorage.getItem('userSettings')!),
                developerMode: val,
            }),
        );
    });

    const analyticsState = window.unigraph.addState(
        'settings/enableAnalytics',
        window.localStorage.getItem('enableAnalytics') === 'true',
    );
    analyticsState.subscribe((val: boolean) => {
        if (val && !window.mixpanel) initAnalyticsIfOptedIn();
        window.localStorage.setItem('enableAnalytics', JSON.stringify(val));
    });

    window.unigraph.addState('global/selected', []);
    window.unigraph.addState('global/selectionStart', false);
    window.unigraph.addState('global/focused', {
        uid: '',
        caret: 0,
        type: '',
        commponent: '',
    });
    window.unigraph.addState('global/focused/actions', {});
    /* Example: {'shift+Tab': {'319908': () => {return true;}}} */
    window.unigraph.addState('global/keyboardShortcuts', {});

    initContextMenu();
    initRegistry();
    initBacklinkManager();
    initPackages();
    initSelect();
    initKeyboardShortcuts();

    if (window.localStorage.getItem('enableAnalytics') === 'true') initAnalyticsIfOptedIn();
}

function initSelect() {
    if (!isMobile()) {
        window.dragselect = new DragSelect({ autoScrollSpeed: 0.0001, draggability: false });
        window.dragselect.subscribe('callback', ({ items, event }: any) => {
            event.stopPropagation();
            event.preventDefault();
            const distance = window.dragselect.getCursorPositionDifference();
            const available = items
                .map((el: any) => {
                    if (el.dataset?.component) {
                        return el.dataset?.component;
                    }
                    return undefined;
                })
                .filter(Boolean);
            const selectedUids = available.filter((el: string) => {
                const elm = document.querySelector(`[data-component="${el}"]`);
                if (!elm) return false;
                const parents = getParents(elm);
                if (_.intersection(parents, available).length > 0) return false;
                return true;
            });
            if (Math.abs(distance.x) > 10 && Math.abs(distance.y) > 10 && !isMultiSelectKeyPressed(event))
                window.unigraph.getState('global/selected').setValue(selectedUids);
            else if (!isMultiSelectKeyPressed(event)) window.unigraph.getState('global/selected').setValue([]);
            document.body.classList.remove('in-multiselect');
        });
        window.dragselect.subscribe('predragstart', ({ items, item, event }: any) => {
            if (!window.unigraph.getState('global/focused').value.uid) {
                document.body.classList.add('in-multiselect');
            } else {
                window.dragselect.break();
            }
        });
    }
}

function initContextMenu() {
    window.unigraph.addState('global/contextMenu', { show: false });
    window.unigraph.addState('global/searchPopup', { show: false });
    window.unigraph.addState('registry/omnibarSummoner', {});
}

function initRegistry() {
    window.unigraph.addState('registry/dynamicView', {
        '$/schema/executable': { view: Executable },
        '$/skeleton/default': { view: DefaultSkeleton },
        '$/schema/notification': { view: CNotification },
        '$/schema/person': { view: BasicPersonView },
        '$/schema/subentity': { view: SubentityView },
        '$/schema/view': { view: ViewItem },
        '$/schema/package_manifest': { view: PackageManifestView },
        '$/schema/list': { view: MiniListView },
    });
    window.unigraph.addState('registry/dynamicViewDetailed', {
        '$/schema/executable': { view: CodeOrComponentView },
        '$/schema/view': { view: ViewViewDetailed },
        '$/schema/list': { view: ListObjectView, query: ListObjectQuery },
    });
    window.unigraph.addState('registry/quickAdder', {});
    window.unigraph.addState('registry/pages', {});
    window.unigraph.addState('registry/widgets', {});
    window.unigraph.addState('registry/components', {});
    window.unigraph.addState('registry/contextMenu', {});
    window.unigraph.addState('registry/commands', {});
    window.unigraph.addState('registry/backlinks', {});
    window.unigraph.addState('registry/backlinksCallbacks', {});
}

function initBacklinkManager() {
    const subsId = getRandomInt();
    let currentObjects: string[] = [];
    let currentResults: any = {};

    window.unigraph.subscribe(
        {
            type: 'object',
            uid: [],
            options: {
                queryFn: backlinkQuery,
            },
        },
        (newBacklinks: any[]) => {
            const newVal = Object.fromEntries(JSON.parse(JSON.stringify(newBacklinks)).map((el: any) => [el.uid, el]));
            newBacklinks
                .map((el) => el.uid)
                .map((el) => {
                    const subs = window.unigraph.getState('registry/backlinksCallbacks').value[el];
                    if (Array.isArray(subs)) subs.forEach((sub) => sub(newVal[el]));
                });
            currentResults = newVal;
        },
        subsId,
    );

    window.unigraph.getState('registry/backlinks').subscribe(
        _.debounce((newVal: Record<string, any>) => {
            currentObjects = _.uniq([...currentObjects, ...Object.keys(newVal)]);
            window.unigraph.subscribe(
                {
                    type: 'object',
                    uid: Object.keys(newVal),
                    options: {
                        queryFn: backlinkQuery,
                    },
                },
                () => false,
                subsId,
                true,
            );
            currentResults = Object.fromEntries(
                Object.entries(currentResults).filter((el) => currentObjects.includes(el[0])),
            );
        }, 20),
    );
}

function initAnalyticsIfOptedIn() {
    // eslint-disable-next-line global-require
    const mixpanel = require('mixpanel-browser');
    window.mixpanel = mixpanel;

    mixpanel.init('d15629c3a0ad692d3b7491a9091dd2be', {
        debug: true,
        ignore_dnt: true, // with user's explicit consent
    });
    mixpanel.track('initAnalyticsAndUserOptedIn');

    (window as any).onEventSend = (eventName: string) => {
        if (!['run_executable', 'unsubscribe_by_id'].includes(eventName)) window.mixpanel?.track(`event/${eventName}`);
    };
}

function initPackages() {
    bmInit();
    emInit();
    tdInit();
    rssInit();
    nbInit();
    smInit();
    twInit();
    reInit();
    clInit();
    pbInit();
}
