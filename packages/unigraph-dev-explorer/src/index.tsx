import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './init';
import './pages';
import * as serviceWorker from './serviceWorker';

import App from './App';
import { SplashScreen } from './pages/SplashScreen';
import { WorkSpace } from './Workspace';
import Settings from './pages/Settings';

function render(component: any) {
  ReactDOM.render(
    <React.StrictMode>{component}</React.StrictMode>,
    document.getElementById('root')
  )
}

const notConnectedScreen = React.createElement(React.Fragment, {}, [
  React.createElement(SplashScreen),
  React.createElement(Settings)
])


render(notConnectedScreen);

window.unigraph.backendConnection.onopen = () => {
  // Register notification center
  window.unigraph.subscribeToType("$/schema/notification", (data: any[]) => {
    const nfState = window.unigraph.getState('notification-center/notifications');
    nfState.setValue(data);
  }, undefined, {all: false, showHidden: true, first: -100})

  const semanticChildrenState = window.unigraph.addState('referenceables/semantic_children', []);
  window.unigraph.getSchemas(['$/schema/interface/semantic']).then((schemas: any) => { 
    semanticChildrenState.setValue((schemas['$/schema/interface/semantic']?._definition as any)?._parameters?._definitions.map((el: any) => el?.type?.['unigraph.id']) || []) 
  })

  if (typeof window.electronPreload === "function") window.electronPreload();

  render((new URLSearchParams(window.location.search)).get('pageName') ? <App/> :<WorkSpace />);

  
  window.unigraph.backendConnection.onclose = () => {
    //setTimeout(() => {window.location.reload()}, 1000) 
    render(notConnectedScreen,)
  };
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
