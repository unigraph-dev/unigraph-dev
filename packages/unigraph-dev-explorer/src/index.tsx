import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import * as serviceWorker from './serviceWorker';
import {unigraph} from 'unigraph-dev-common';

import App from './App';
import { SplashScreen, DisconnectedSplashScreen} from './pages/SplashScreen';

window.unigraph = unigraph("ws://localhost:3001");

function render(component: any) {
  ReactDOM.render(
    component,
    document.getElementById('root')
  )
}

render(<React.StrictMode>
  <SplashScreen />
</React.StrictMode>,);

window.unigraph.backendConnection.onopen = () => {
  render(<React.StrictMode>
    <App />
  </React.StrictMode>,)
};

window.unigraph.backendConnection.onclose = () => {
  render(<React.StrictMode>
    <DisconnectedSplashScreen />
  </React.StrictMode>,)
};


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
