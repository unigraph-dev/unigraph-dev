import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { init } from './init';
import { initDefaultComponents } from './pages';
import * as serviceWorker from './serviceWorker';

import App from './App';
import { WorkSpace } from './Workspace';
import { DynamicComponentView, getComponentAsView } from './components/ObjectView/DynamicComponentView';
import { getComponentFromExecutable, registerDetailedDynamicViews, registerDynamicViews } from './unigraph-react';

function render(component: any) {
    ReactDOM.render(<React.StrictMode>{component}</React.StrictMode>, document.getElementById('root'));
}

init();
initDefaultComponents();

if (typeof window.electronPreload === 'function') window.electronPreload();

render(new URLSearchParams(window.location.search).get('pageName') ? <App /> : <WorkSpace />);

function initDynamicObjectViews() {
    window.unigraph.subscribeToType(
        '$/schema/object_view',
        (views: any[]) => {
            // console.log(views);
            views.forEach(async (el) => {
                const typeId = el.get('item_type')._value['unigraph.id'];
                const view = await getComponentAsView(el._value.view._value, {});
                registerDynamicViews({ [typeId]: { view } });
            });
        },
        undefined,
        { all: false },
    );

    window.unigraph.subscribeToType(
        '$/schema/object_view_detailed',
        (views: any[]) => {
            views.forEach(async (el) => {
                const typeId = el.get('item_type')._value['unigraph.id'];
                const view = await getComponentAsView(el._value.view._value, {});
                registerDetailedDynamicViews({
                    [typeId]: {
                        view,
                        maximize: el._value?.maximize?.['_value.!'],
                    },
                });
            });
        },
        undefined,
        { all: false },
    );

    window.unigraph.subscribeToType(
        '$/schema/view',
        async (views: any[]) => {
            const resolvedViews = await Promise.all(
                views
                    .filter((el) => el?._value?.view?._value?.type?.['unigraph.id'] === '$/schema/executable')
                    .map(async (el) => [
                        el._value.view._value.uid,
                        {
                            name: el._value.name['_value.%'],
                            constructor: await getComponentAsView(el._value.view._value, {}),
                        },
                    ]),
            );
            const currPages = window.unigraph.getState('registry/pages');
            currPages.setValue({
                ...currPages.value,
                ...Object.fromEntries(resolvedViews),
            });
            window.reloadCommands();
        },
        undefined,
        { all: false },
    );
}

window.unigraph.onReady!(() => {
    // Register notification center
    window.unigraph.subscribeToType(
        '$/schema/notification',
        (data: any[]) => {
            const nfState = window.unigraph.getState('notification-center/notifications');
            nfState.setValue(data);
        },
        undefined,
        { all: false, showHidden: true, first: -30 },
    );

    const semanticChildrenState = window.unigraph.addState('referenceables/semantic_children', []);
    window.unigraph.getSchemas(['$/schema/interface/semantic']).then((schemas: any) => {
        semanticChildrenState.setValue(
            (schemas['$/schema/interface/semantic']?._definition as any)?._parameters?._definitions.map(
                (el: any) => el?.type?.['unigraph.id'],
            ) || [],
        );
    });

    initDynamicObjectViews();
    window.reloadCommands();

    /* window.unigraph.backendConnection.onclose = () => {
    //setTimeout(() => {window.location.reload()}, 1000)
    render(notConnectedScreen,)
  }; */
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
