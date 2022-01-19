/**
 * Helper functions for using Unigraph as an embedded component in another app.
 */

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactDOM from 'react-dom';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicView } from './components/ObjectView/AutoDynamicView';
import { getComponentAsView } from './components/ObjectView/DynamicComponentView';
import { init } from './init';
import { initDefaultComponents } from './pages';
import { registerDynamicViews, registerDetailedDynamicViews } from './unigraph-react';

function UnigraphComponent({ uid }: any) {
    const [object, setObject] = React.useState<any>(undefined);
    React.useEffect(() => {
        const subsId = getRandomInt();

        window.unigraph.subscribeToObject(
            uid,
            (obj: any) => {
                setObject(obj);
            },
            subsId,
        );

        return function cleanup() {
            window.unigraph.unsubscribe(subsId);
        };
    }, []);

    return <DndProvider backend={HTML5Backend}>{object ? <AutoDynamicView object={object} /> : []}</DndProvider>;
}

export const mountComponentWithUid = (uid: string, elementId: string) => {
    ReactDOM.render(
        <React.StrictMode>
            <UnigraphComponent uid={uid} />
        </React.StrictMode>,
        document.getElementById(elementId),
    );
};

export const initUnigraphEmbed = (location?: string) => {
    init(location);
    initDefaultComponents();

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
            { all: true },
        );

        window.unigraph.subscribeToType(
            '$/schema/object_view_detailed',
            (views: any[]) => {
                views.forEach(async (el) => {
                    const typeId = el.get('item_type')._value['unigraph.id'];
                    const view = await getComponentAsView(el._value.view._value, {});
                    registerDetailedDynamicViews({ [typeId]: { view } });
                });
            },
            undefined,
            { all: true },
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
            },
            undefined,
            { all: true },
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
};
