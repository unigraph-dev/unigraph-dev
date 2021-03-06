import { unigraph } from "unigraph-dev-common";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { isJsonString } from "unigraph-dev-common/lib/utils/utils";
import { ExecutableCodeEditor } from "./components/ObjectView/DefaultCodeEditor";
import { DefaultSkeleton, Executable, ViewViewDetailed } from "./components/ObjectView/DefaultObjectView";
import { ANotification, Notification as CNotification } from "./components/UnigraphCore/Notification";
import { UserSettings } from "./global";

import { init as nb_init } from './examples/notes/NoteBlock';
import { init as sm_init } from './examples/semantic/init';
import { init as tw_init } from './examples/twitter/Tweet';

/**
 * Things to do when Unigraph explorer loads
 */
function init() {
    console.log("initialized!")
    let hst = window.location.hostname.length ? window.location.hostname : "localhost";

    const defaultSettings: UserSettings = {
        serverLocation: `ws://${hst}:3001`,
        newWindow: "new-tab",
        nativeNotifications: true,
        developerMode: false
    }

    let userSettings = defaultSettings;

    if (!isJsonString(window.localStorage.getItem('userSettings'))) {
        window.localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    } else { // @ts-ignore: checked type already
        userSettings = JSON.parse(window.localStorage.getItem('userSettings')) 
    }

    // Connect to Unigraph
    window.unigraph = unigraph(userSettings.serverLocation);

    const nfState = window.unigraph.addState('notification-center/notifications', []);
    nfState.subscribe((el: any[]) => {
        el = JSON.parse(JSON.stringify(el)).pop();
        const unpadded: ANotification = unpad(el); 
        let updated = new Date(unpadded?._timestamp?._updatedAt);
        let current = new Date();
        if (current.valueOf() - updated.valueOf() < 5000) {
            new Notification(unpadded.name, {body: unpadded.from + ": " + unpadded.content})
        }
    });

    const devState = window.unigraph.addState('settings/developerMode', userSettings.developerMode);
    devState.subscribe((val: boolean) => {
        window.localStorage.setItem('userSettings', JSON.stringify({...JSON.parse(window.localStorage.getItem('userSettings')!), developerMode: val}))
    });

    initContextMenu();
    initRegistry();
    initPackages();
}

export type ContextMenuState = {
    anchorPosition: {top: number, left: number},
    menuContent: ((uid: string, object: any, onfire: () => any, callbacks?: any) => React.ReactElement)[],
    contextObject: any,
    contextUid: string,
    menuContextContent: ((uid: string, object: any, onfire: () => any, callbacks?: any) => React.ReactElement)[],
    contextContextObject?: any,
    contextContextUid?: string,
    removeFromContext?: string,
    callbacks?: any,
    show: boolean
}

function initContextMenu() {
    window.unigraph.addState('global/contextMenu', {show: false});
}

function initRegistry() {
    window.unigraph.addState('registry/dynamicView', {
        "$/schema/executable": Executable,
        "$/skeleton/default": DefaultSkeleton,
        "$/schema/notification": CNotification
    });
    window.unigraph.addState('registry/dynamicViewDetailed', {
        "$/schema/executable": ExecutableCodeEditor,
        "$/schema/view": ViewViewDetailed
    });
    window.unigraph.addState('registry/pages', {});
    window.unigraph.addState('registry/widgets', {});
    window.unigraph.addState('registry/contextMenu', {});
}

function initPackages() {
    nb_init(); sm_init(); tw_init();
}

init();