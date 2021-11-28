import { unigraph } from "unigraph-dev-common";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { isJsonString } from "unigraph-dev-common/lib/utils/utils";
import { CodeOrComponentView, DefaultSkeleton, Executable, ViewViewDetailed } from "./components/ObjectView/DefaultObjectView";
import { ANotification, Notification as CNotification } from "./components/UnigraphCore/Notification";
import { UserSettings } from "./global";

import { init as nb_init } from './examples/notes/init';
import { init as sm_init } from './examples/semantic/init';
import { init as cl_init } from './examples/calendar/init';
import { init as tw_init } from './examples/twitter/Tweet';
import { init as re_init } from './examples/reddit/RedditPost';
import { pb_init } from './components/UnigraphCore/Pinboard';

import { ListObjectQuery, ListObjectView } from "./components/UnigraphCore/ListObjectView";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { SubentityView } from "./components/UnigraphCore/SubentityView";

/**
 * Things to do when Unigraph explorer loads
 */
function init() {
    console.log("initialized!")
    let hst = window.location.hostname.length ? window.location.hostname : "localhost";
    let browserId = `${getRandomInt()}${getRandomInt()}`;

    const defaultSettings: UserSettings = {
        serverLocation: `ws://${hst}:3001`,
        newWindow: "new-tab",
        nativeNotifications: true,
        developerMode: false,
        browserId: browserId
    }

    let userSettings = defaultSettings;

    if (!isJsonString(window.localStorage.getItem('userSettings'))) {
        window.localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    } else { // @ts-ignore: checked type already
        userSettings = JSON.parse(window.localStorage.getItem('userSettings'));
    }

    // Connect to Unigraph
    window.unigraph = unigraph(userSettings.serverLocation, userSettings.browserId);

    const nfState = window.unigraph.addState('notification-center/notifications', []);
    nfState.subscribe((el: any[]) => {
        el = [...el].pop();
        const unpadded: ANotification = unpad(el); 
        let updated = new Date(unpadded?._timestamp?._updatedAt);
        let current = new Date();
        if (current.valueOf() - updated.valueOf() < 5000 && Notification) {
            new Notification(unpadded.name, {body: unpadded.from + ": " + unpadded.content})
        }
    });

    const devState = window.unigraph.addState('settings/developerMode', userSettings.developerMode);
    devState.subscribe((val: boolean) => {
        window.localStorage.setItem('userSettings', JSON.stringify({...JSON.parse(window.localStorage.getItem('userSettings')!), developerMode: val}))
    });

    window.unigraph.addState('global/selected', []);

    initContextMenu();
    initRegistry();
    initPackages();
}

export type ContextMenuState = {
    anchorPosition: {top: number, left: number},
    menuContent: ((uid: string, object: any, onfire: () => any, callbacks?: any, contextUid?: string) => React.ReactElement)[],
    contextObject: any,
    contextUid: string,
    schemaMenuContent: ((uid: string, object: any, onfire: () => any, callbacks?: any, contextUid?: string) => React.ReactElement)[],
    menuContextContent: ((uid: string, object: any, onfire: () => any, callbacks?: any, contextUid?: string) => React.ReactElement)[],
    contextContextObject?: any,
    contextContextUid?: string,
    removeFromContext?: string,
    callbacks?: any,
    extraContent: any,
    windowName?: string,
    show: boolean
}

export type SearchPopupState = {
    anchorPosition?: {top: number, left: number},
    anchorEl?: any,
    show: boolean,
    search?: string,
    onSelected?: (newName: string, newUid: string) => any;
    default: {
        label: (search: string) => string;
        onSelected: (search: string) => Promise<string>;
    }[]
}

function initContextMenu() {
    window.unigraph.addState('global/contextMenu', {show: false});
    window.unigraph.addState('global/searchPopup', {show: false});
    window.unigraph.addState('registry/omnibarSummoner', {});
}

function initRegistry() {
    window.unigraph.addState('registry/dynamicView', {
        "$/schema/executable": {view: Executable},
        "$/skeleton/default": {view: DefaultSkeleton},
        "$/schema/notification": {view: CNotification},
        "$/schema/subentity": {view: SubentityView},
    });
    window.unigraph.addState('registry/dynamicViewDetailed', {
        "$/schema/executable": {view: CodeOrComponentView},
        "$/schema/view": {view: ViewViewDetailed},
        '$/schema/list': {view: ListObjectView, query: ListObjectQuery},
    });
    window.unigraph.addState('registry/quickAdder', {})
    window.unigraph.addState('registry/pages', {});
    window.unigraph.addState('registry/widgets', {});
    window.unigraph.addState('registry/components', {});
    window.unigraph.addState('registry/contextMenu', {});
}

function initPackages() {
    nb_init(); sm_init(); tw_init(); re_init(); cl_init(); pb_init();
}

init();