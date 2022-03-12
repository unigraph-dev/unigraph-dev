/* eslint-disable @typescript-eslint/no-var-requires */
import { Typography } from '@mui/material';
import DragSelect from 'dragselect';
import _ from 'lodash';
import { unigraph } from 'unigraph-dev-common';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { getRandomInt, isJsonString } from 'unigraph-dev-common/lib/utils/utils';
import { backlinkQuery } from './components/ObjectView/backlinksUtils';
import { BasicPersonView, DefaultSkeleton } from './components/ObjectView/BasicObjectViews';
import { ViewViewDetailed } from './components/ObjectView/DefaultObjectView';
import { CodeOrComponentView, Executable } from './components/ObjectView/ExecutableView';
import { ViewItem } from './components/ObjectView/ViewObjectView';
import { PackageManifestView } from './components/PackageManager/PackageManager';
import { ListObjectQuery, ListObjectView } from './components/UnigraphCore/ListObjectView';
import { MiniListView } from './components/UnigraphCore/ListsList';
import { ANotification, Notification as CNotification } from './components/UnigraphCore/Notification';
import { init as pbInit } from './components/UnigraphCore/Pinboard';
import { SubentityView } from './components/UnigraphCore/SubentityView';
import { init as bmInit } from './examples/bookmarks/Bookmarks';
import { init as clInit } from './examples/calendar/init';
import { init as emInit } from './examples/email/Email';
import { init as nbInit } from './examples/notes/init';
import { init as reInit } from './examples/reddit/RedditPost';
import { init as rssInit } from './examples/rss_reader/RSSFeeds';
import { init as smInit } from './examples/semantic/init';
import { init as tdInit } from './examples/todo/TodoList';
import { init as twInit } from './examples/twitter/Tweet';
import { UserSettings } from './global';
import { initKeyboardShortcuts } from './keyboardShortcuts';
import { registerQuickAdder } from './unigraph-react';
import { getParents, isMobile, isMultiSelectKeyPressed } from './utils';

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
                dontClose: true,
            };
        })
        .filter(Boolean);

    commandsState.setValue([...adderCommands, ...pageCommands]);
};

/**
 * Things to do when Unigraph explorer loads
 */
export function init(hostname?: string) {
    console.log('initialized!');
    const hst = hostname || (window.location.hostname.length ? window.location.hostname : 'localhost');
    const browserId = `${getRandomInt()}${getRandomInt()}`;

    const defaultServer = `ws://${hst}:4002`;
    const defaultSettings: UserSettings = {
        serverLocation: defaultServer,
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
        if (userSettings.serverLocation === `ws://${hst}:3001`) {
            // Migrating from earlier versions
            userSettings.serverLocation = defaultServer;
            window.localStorage.setItem('userSettings', JSON.stringify(userSettings));
        }
    }

    // Connect to Unigraph
    window.unigraph = unigraph(userSettings.serverLocation, userSettings.browserId + window.location.search);

    const nfState = window.unigraph.addState('notification-center/notifications', []);
    nfState.subscribe((el: any[]) => {
        el = [...el].pop();
        const unpadded: ANotification = unpad(el);
        const updated = new Date(unpadded?._updatedAt);
        const current = new Date();
        if (current.valueOf() - updated.valueOf() < 5000 && Notification && !isMobile()) {
            /*
            // eslint-disable-next-line no-new
            new Notification(unpadded.name, {
                body: `${unpadded.from}: ${unpadded.content}`,
            });
            */
            // Disable notifications until further polish
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
    window.unigraph.addState('global/activeTab', '');

    if (window.localStorage.getItem('enableAnalytics') === 'true') initAnalyticsIfOptedIn();

    initContextMenu();
    initRegistry();
    initBacklinkManager();
    initPackages();
    initSelect();
    initKeyboardShortcuts();

    registerListQuickAdder();
}

function initSelect() {
    const getSelected = (items: any[]) => {
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
        return selectedUids;
    };

    if (!isMobile()) {
        window.dragselect = new DragSelect({ autoScrollSpeed: 0.0001, draggability: false });
        window.dragselect.subscribe('callback', ({ items, event }: any) => {
            const distance = window.dragselect.getCursorPositionDifference();
            const selectedUids = getSelected(items);
            if (
                Math.abs(distance.x) > 5 &&
                Math.abs(distance.y) > 5 &&
                !isMultiSelectKeyPressed(event) &&
                document.body.classList.contains('in-multiselect')
            )
                window.unigraph.getState('global/selected').setValue(selectedUids);
            else if (!isMultiSelectKeyPressed(event)) window.unigraph.getState('global/selected').setValue([]);
            document.body.classList.remove('in-multiselect');
        });
        window.dragselect.subscribe(
            'dragmove',
            _.throttle(({ items, item, event }: any) => {
                const distance = window.dragselect.getCursorPositionDifference();
                if (
                    Math.abs(distance.x) > 5 &&
                    Math.abs(distance.y) > 5 &&
                    (document.getSelection()?.type === 'Caret' || getSelected(items).length > 1)
                ) {
                    console.log(getSelected(items).length);
                    document.body.classList.add('in-multiselect');
                    if (document.getSelection()?.type !== 'Caret') document.getSelection()?.removeAllRanges();
                }
            }, 150),
        );
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
            const newVal = Object.fromEntries(newBacklinks.map((el: any) => [el.uid, el]));
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
        }, 200),
    );
}

/**
 * Initializes analytics when user explicitly opted in.
 *
 * Information we collect:
 * - basic info: time, email (user-given), browser, os, country
 * - user actions: click, keypress - anonimized into 15 second chunks
 *
 * We use them to calculate session length and usage frequency.
 *
 * Your anonymized data is shared with Mixpanel.
 */
function initAnalyticsIfOptedIn() {
    // eslint-disable-next-line global-require
    const mixpanel = require('mixpanel-browser');
    window.mixpanel = mixpanel;

    mixpanel.init('d15629c3a0ad692d3b7491a9091dd2be', {
        persistence: 'localStorage',
        debug: true,
        ignore_dnt: true, // with user's explicit consent
        // eslint-disable-next-line inclusive-language/use-inclusive-words -- pre-defined property
        property_blacklist: [
            // don't request detailed information
            '$city',
            '$initial_referring_domain',
            '$initial_referrer',
            '$screen_height',
            '$screen_width',
            '$current_url',
        ],
    });
    mixpanel.track('initAnalyticsAndUserOptedIn');

    const onUserInteraction = _.throttle(() => {
        mixpanel.track('userInteraction');
    }, 1000 * 60 * 1); // anonymize user interaction into 1 minute chunks
    document.addEventListener('pointerdown', onUserInteraction, true);
    document.addEventListener('keydown', onUserInteraction, true);
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

const registerListQuickAdder = () => {
    const quickAdder = async (
        inputStr: string,
        // eslint-disable-next-line default-param-last
        preview = true,
        callback: any,
        refs?: any,
    ) => {
        const newObj = { name: inputStr, children: [], $context: { _hide: false } };
        if (!preview) {
            const uids = await window.unigraph.addObject(newObj, '$/schema/list');
            return uids;
        }

        return [newObj, '$/schema/list'];
    };

    const tt = () => (
        <div>
            <Typography>Enter the list&apos;s name, then press Enter to go</Typography>
        </div>
    );
    registerQuickAdder({
        list: {
            adder: quickAdder,
            tooltip: tt,
            description: 'Start a new list',
            alias: ['l'],
        },
    });
};
