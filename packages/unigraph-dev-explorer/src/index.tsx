import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import * as serviceWorker from './serviceWorker';
import { unigraph } from 'unigraph-dev-common';
import { isJsonString } from 'unigraph-dev-common/lib/utils/utils'

import { DynamicViews, DynamicViewsDetailed } from './components/ObjectView/DefaultObjectView'

import App from './App';
import { SplashScreen, DisconnectedSplashScreen} from './pages/SplashScreen';
import { WorkSpace } from './Workspace';
import { UserSettings } from './global';
import { ANotification } from './components/UnigraphCore/Notification';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';

let hst = window.location.hostname.length ? window.location.hostname : "localhost";

// Load dynamic views registry
window.DynamicViews = DynamicViews;
window.DynamicViewsDetailed = DynamicViewsDetailed;

window.notificationCallbacks = [];
window.registerNotifications = (callback: ((data: any[]) => any)) => {
  callback(window.notifications);
  window.notificationCallbacks.push(callback)
}

const defaultSettings: UserSettings = {
  serverLocation: `ws://${hst}:3001`,
  "new-window": "new-tab",
  nativeNotifications: false
}

let userSettings = defaultSettings;

if (!isJsonString(window.localStorage.getItem('userSettings'))) {
  window.localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
} else { // @ts-ignore: checked type already
  userSettings = JSON.parse(window.localStorage.getItem('userSettings')) 
}

// Connect to Unigraph
window.unigraph = unigraph(userSettings.serverLocation);

function render(component: any) {
  ReactDOM.render(
    component,
    document.getElementById('root')
  )
}

if (window.location.pathname === '/pages') {
  render(<React.StrictMode>
    <App />
  </React.StrictMode>,)
} else {
  render(<React.StrictMode>
    <SplashScreen />
  </React.StrictMode>,);
  
  window.unigraph.backendConnection.onopen = () => {
    // Register notification center
    // TODO: Do we need a state management library? Ask around and evaluate.
    window.unigraph.subscribeToType("$/schema/notification", (data: any[]) => {
      window.notifications = data;
      window.notificationCallbacks.forEach(el => el(data));
    }).then(() => {
      if (isJsonString(window.localStorage.getItem('userSettings')) && // @ts-expect-error: Already checked for nullity
        JSON.parse(window.localStorage.getItem('userSettings'))['nativeNotifications']) {
          window.notificationCallbacks.push((el: any) => {
            const unpadded: ANotification = unpad(el); 
            console.log(unpadded);
            const nfn = new Notification(unpadded.name, {body: unpadded.from + ": " + unpadded.content})
          })
      }
    })

    render(<React.StrictMode>
      <WorkSpace />
    </React.StrictMode>,);
  };
  
  window.unigraph.backendConnection.onclose = () => {
    setTimeout(() => {window.location.reload()}, 1000) 
    render(<React.StrictMode>
      <DisconnectedSplashScreen />
    </React.StrictMode>,)
  };
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
