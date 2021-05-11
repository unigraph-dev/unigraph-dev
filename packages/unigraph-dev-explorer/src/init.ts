import { unigraph } from "unigraph-dev-common";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { isJsonString } from "unigraph-dev-common/lib/utils/utils";
import { DynamicViews, DynamicViewsDetailed } from "./components/ObjectView/DefaultObjectView";
import { ANotification } from "./components/UnigraphCore/Notification";
import { UserSettings } from "./global";

/**
 * Things to do when Unigraph explorer loads
 */
export default function init() {
    let hst = window.location.hostname.length ? window.location.hostname : "localhost";

    // Load dynamic views registry
    window.DynamicViews = DynamicViews;
    window.DynamicViewsDetailed = DynamicViewsDetailed;

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
        const nfn = new Notification(unpadded.name, {body: unpadded.from + ": " + unpadded.content})
        console.log(unpadded);
    }
    });

    const devState = window.unigraph.addState('settings/developerMode', userSettings.developerMode);
    devState.subscribe((val: boolean) => {
    window.localStorage.setItem('userSettings', JSON.stringify({...JSON.parse(window.localStorage.getItem('userSettings')!), developerMode: val}))
    })
}