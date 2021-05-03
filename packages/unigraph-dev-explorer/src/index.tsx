import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import * as serviceWorker from './serviceWorker';
import { unigraph } from 'unigraph-dev-common';
import { isJsonString } from 'unigraph-dev-common/lib/utils/utils'

import App from './App';
import { SplashScreen, DisconnectedSplashScreen} from './pages/SplashScreen';
import { WorkSpace } from './Workspace';
import { UserSettings } from './pages/Settings';

let hst = window.location.hostname.length ? window.location.hostname : "localhost";

const defaultSettings: UserSettings = {
  serverLocation: `ws://${hst}:3001`
}

let userSettings = defaultSettings;

if (!isJsonString(window.localStorage.getItem('userSettings'))) {
  window.localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
} else { // @ts-ignore: checked type already
  userSettings = JSON.parse(window.localStorage.getItem('userSettings')) 
}

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
