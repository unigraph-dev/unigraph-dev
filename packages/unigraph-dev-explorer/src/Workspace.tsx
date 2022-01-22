/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React from 'react';

import { MuiPickersUtilsProvider } from '@material-ui/pickers';

import FlexLayout, { Action, Actions, DockLocation, Model, Node, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import './workspace.css';
import { Container, CssBaseline, ListItem, Popover, Typography } from '@material-ui/core';
import { isJsonString } from 'unigraph-dev-common/lib/utils/utils';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { Menu, Details } from '@material-ui/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import MomentUtils from '@date-io/moment';

import Icon from '@mdi/react';
import { mdiFormTextarea, mdiStarPlusOutline, mdiSync, mdiTagMultipleOutline } from '@mdi/js';
import _ from 'lodash';
import { components } from './pages';
import { InlineSearch } from './components/UnigraphCore/InlineSearchPopup';
import { ContextMenu } from './components/UnigraphCore/ContextMenu';
import { getComponentFromPage, getParameters, isElectron, isSmallScreen, TabContext } from './utils';
import { SearchOverlayPopover } from './pages/SearchOverlay';
import { MobileBar } from './components/UnigraphCore/MobileBar';

export function WorkspacePageComponent({ children, maximize, paddingTop, id, tabCtx }: any) {
    const [_maximize, setMaximize] = React.useState(maximize);
    tabCtx.setMaximize = (val: boolean) => {
        setMaximize(val);
    };
    const memoTabCtx = React.useMemo(() => tabCtx, [id]);

    return (
        <TabContext.Provider value={memoTabCtx}>
            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                <Container
                    maxWidth={_maximize ? false : 'lg'}
                    id={`workspaceContainer${id}`}
                    disableGutters
                    style={{
                        paddingTop: _maximize || !paddingTop ? '0px' : '12px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <CssBaseline />
                    {children}
                </Container>
            </div>
        </TabContext.Provider>
    );
}

const WorkspaceInnerEl_ = ({ config, component }: any) => {
    const pages = window.unigraph.getState('registry/pages');
    if (component.startsWith('/pages/')) {
        const page = pages.value[component.replace('/pages/', '') as string];
        return page.constructor(config);
    }
    if (component.startsWith('/components/')) {
        return components[component.replace('/components/', '') as string].constructor(config.viewConfig);
    }
    return () => '';
};
const WorkspaceInnerEl = React.memo(WorkspaceInnerEl_, (a, b) => JSON.stringify(a) === JSON.stringify(b));

function ConnectionIndicator() {
    const [connected, setConnected] = React.useState(false);
    React.useMemo(() => {
        window.unigraph.getState('unigraph/connected').subscribe((conn) => {
            setConnected(conn);
        });
    }, []);
    return (
        <span
            style={{
                height: '16px',
                width: '16px',
                borderRadius: '8px',
                backgroundColor: connected ? 'lightgreen' : 'red',
                border: '1px solid grey',
                marginRight: '8px',
                display: connected ? 'none' : '',
            }}
        />
    );
}

function MobileOmnibarIndicator() {
    return (
        <div
            style={{ marginRight: '16px' }}
            onClick={() => {
                window.unigraph.getState('global/omnibarSummoner').setValue({
                    show: true,
                    tooltip: '',
                    defaultValue: '',
                });
            }}
        >
            <Icon path={mdiFormTextarea} size={0.7} style={{ verticalAlign: 'middle' }} key="icon" />
        </div>
    );
}

function ExecutablesIndicator() {
    const [totalExecutables, setTotalExecutables] = React.useState([]);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    React.useMemo(() => {
        window.unigraph.onCacheUpdated?.('runningExecutables', (cacheResult: any) => {
            setTotalExecutables(cacheResult);
        });
    }, []);
    return (
        <div
            style={{
                marginRight: '16px',
                display: totalExecutables.length > 0 ? '' : 'none',
            }}
        >
            <Popover
                open={totalExecutables.length > 0 && Boolean(anchorEl)}
                anchorEl={anchorEl}
                disableRestoreFocus
                style={{ pointerEvents: 'none' }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {totalExecutables.map((el: any) => (
                    <ListItem>
                        {el.name},{new Date(el.since).toLocaleString()}
                    </ListItem>
                ))}
            </Popover>
            <div
                onMouseEnter={(event) => {
                    setAnchorEl(event.currentTarget);
                }}
                onMouseLeave={() => {
                    setAnchorEl(null);
                    console.log('aaaa');
                }}
            >
                <Icon path={mdiSync} size={0.7} style={{ verticalAlign: 'middle' }} key="icon" />
                {totalExecutables.length}
            </div>
        </div>
    );
}

const getFinalJson = (model: Model, initJson: any) => {
    let customTitle = false;
    if (initJson.customTitle) {
        customTitle = true;
        delete initJson.customTitle;
    }
    const newJson = { ...initJson, id: getRandomInt().toString(), customTitle };
    newJson.config = { viewConfig: newJson.config || {} };
    newJson.config.id = newJson.id;
    return newJson;
};

const newWindowActions = {
    'new-tab': (model: Model, initJson: any) => {
        const newJson = getFinalJson(model, initJson);
        model.doAction(Actions.addNode(newJson, 'workspace-main-tabset', DockLocation.CENTER, -1));
    },
    'new-pane': (model: Model, initJson: any) => {
        const newJson = getFinalJson(model, initJson);
        const action = Actions.addNode(newJson, 'workspace-main-tabset', DockLocation.RIGHT, 0, true);
        model.doAction(action);
    },
    'new-popout': (model: Model, initJson: any) => {
        const someId = getRandomInt().toString();
        const newJson = getFinalJson(model, initJson);
        newJson.id = someId;
        const action = Actions.addNode(newJson, 'workspace-main-tabset', DockLocation.CENTER, -1, false);
        model.doAction(action);
        model.doAction(Actions.floatTab(someId));
    },
};

window.closeTab = (tabId: any) => {
    const action = Actions.deleteTab(tabId);
    window.layoutModel.doAction(action);
};

const newTab = (model: Model, initJson: any) => {
    if (initJson.component && window.localStorage.getItem('enableAnalytics') === 'true') {
        window.mixpanel?.track('selectTab', {
            component: initJson.component,
            new: true,
        });
    }
    const userSettings = JSON.parse(
        // @ts-expect-error: already checked for isJsonString
        isJsonString(window.localStorage.getItem('userSettings')) ? window.localStorage.getItem('userSettings') : '{}',
    );
    const newWindowBehavior =
        userSettings.newWindow && Object.keys(newWindowActions).includes(userSettings.newWindow)
            ? userSettings.newWindow
            : 'new-tab';
    // @ts-expect-error: already checked and added fallback
    newWindowActions[newWindowBehavior](model, initJson);
};

window.newTab = newTab;

const workspaceNavigator = (model: Model, location: string) => {
    if (location === '/home') {
        window.layoutModel.doAction(Actions.selectTab('home'));
        return;
    }
    const search = `?${location.split('?')[1]}`;
    const loc = location.split('?')[0];
    newTab(model, getComponentFromPage(loc, getParameters(search.slice(1))));
};

const mainTabsetId = 'workspace-main-tabset';

const setTitleOnRenderTab = (model: Model) => {
    // @ts-expect-error: using private API
    const idMap: Record<string, Node> = model._idMap;
    const count =
        Object.values(idMap).reduce((curr, it) => {
            // @ts-expect-error: using private API
            if (it?._attributes?.type === 'tab') return curr + 1;
            return curr;
        }, 0) - 1;
    // @ts-expect-error: using private API
    let selIndex = model.getActiveTabset()?._attributes?.selected;
    selIndex = selIndex || 0;
    let selName = 'Loading';

    if (model.getActiveTabset() === undefined) {
        // @ts-expect-error: using private API
        model._setActiveTabset(model.getNodeById(mainTabsetId));
    }
    try {
        // @ts-expect-error: using private API
        selName = model.getActiveTabset()?._children?.[selIndex]?.getName();
    } catch (e) {
        return;
    }
    const titleStr = `${selName} and ${count - 4} other tabs - Unigraph`;
    const titleStrZero = `${selName} - Unigraph`;
    const finalTitle = count - 4 > 0 ? titleStr : titleStrZero;
    document.title = finalTitle;
};

export function WorkSpace(this: any) {
    const json = {
        global: {
            tabSetTabStripHeight: 40,
            tabEnableRename: false,
            splitterSize: 1,
            splitterExtra: 12,
            tabEnableRenderOnDemand: true,
        },
        borders: [
            {
                type: 'border',
                location: 'left',
                id: 'border-left',
                selected: isSmallScreen() ? -1 : 0,
                minSize: 240,
                size: 240,
                children: [
                    {
                        type: 'tab',
                        enableClose: false,
                        minSize: 700,
                        maxSize: 700,
                        name: 'App Drawer',
                        id: 'app-drawer',
                        component: '/components/appdrawer',
                    },
                ],
            },
            {
                type: 'border',
                location: 'bottom',
                id: 'border-bottom',
                selected: -1,
                children: [
                    {
                        type: 'tab',
                        enableClose: false,
                        minSize: 700,
                        maxSize: 700,
                        name: 'Categories',
                        id: 'category-pane',
                        component: '/pages/categories',
                    },
                ],
            },
            {
                type: 'border',
                location: 'right',
                id: 'border-right',
                selected: -1,
                children: [
                    {
                        type: 'tab',
                        enableClose: false,
                        minSize: 700,
                        maxSize: 700,
                        name: 'Inspector',
                        id: 'inspector-pane',
                        component: '/pages/inspector',
                    },
                ],
            },
        ],
        layout: {
            type: 'row',
            weight: 100,
            children: [
                {
                    type: 'tabset',
                    id: mainTabsetId,
                    enableDeleteWhenEmpty: false,
                    weight: 50,
                    selected: 0,
                    children: [
                        {
                            ...getComponentFromPage('/home'),
                            enableClose: false,
                            id: 'home',
                            enableDrag: false,
                        },
                    ],
                },
            ],
        },
    };

    const pages = window.unigraph.getState('registry/pages');

    const tabCtx = React.useMemo(
        () => (node: Node, config: any) => ({
            // @ts-expect-error: using private API
            viewId: node._attributes.id,
            setTitle: (title: string) => {
                if (config.customTitle) {
                    return false;
                }
                return false;
            },
            setMaximize: (val: boolean) => false,
            isVisible: () =>
                // @ts-expect-error: using private API
                window.layoutModel.getNodeById(node._attributes.id).isVisible(),

            subscribeToType: (name: any, callback: any, eventId?: any, options?: any) => {
                const subsState = window.unigraph.getState(`tabs/${(node as any)._attributes.id}/subscriptions`);
                subsState.setValue([...(subsState.value || []), eventId]);
                return window.unigraph.subscribeToType(name, callback, eventId, options);
            },
            subscribeToObject: (uid: any, callback: any, eventId?: any, options?: any) => {
                const subsState = window.unigraph.getState(`tabs/${(node as any)._attributes.id}/subscriptions`);
                subsState.setValue([...(subsState.value || []), eventId]);
                return window.unigraph.subscribeToObject(uid, callback, eventId, options);
            },
            subscribeToQuery: (fragment: any, callback: any, eventId?: any, options?: any) => {
                const subsState = window.unigraph.getState(`tabs/${(node as any)._attributes.id}/subscriptions`);
                subsState.setValue([...(subsState.value || []), eventId]);
                return window.unigraph.subscribeToQuery(fragment, callback, eventId, options);
            },
            subscribe: (query: any, callback: any, eventId?: any, update?: any) => {
                const subsState = window.unigraph.getState(`tabs/${(node as any)._attributes.id}/subscriptions`);
                subsState.setValue([...(subsState.value || []), eventId]);
                return window.unigraph.subscribe(query, callback, eventId, update);
            },
            unsubscribe: (id: any) => {
                const subsState = window.unigraph.getState(`tabs/${(node as any)._attributes.id}/subscriptions`);
                subsState.setValue(_.difference(subsState.value || [], [id]));
                return window.unigraph.unsubscribe(id);
            },
        }),
        [],
    );

    const factory = (node: any) => {
        const component = node.getComponent();
        const config = node.getConfig() || {};
        const page = pages.value[component.replace('/pages/', '') as string];

        const subber = (isVisible: boolean) => {
            // console.log(`Tab id ${node._attributes.id}'s visibility status is ${isVisible}`)
            const subs = window.unigraph.getState(`tabs/${(node as any)._attributes.id}/subscriptions`).value || [];
            window.unigraph.hibernateOrReviveSubscription(subs, isVisible);
        };
        window.unigraph.getState(`tabs/${(node as any)._attributes.id}/isVisible`).subscribers = [subber];

        return component.startsWith('/pages/') ? (
            <WorkspacePageComponent
                maximize={page.maximize}
                paddingTop={page.paddingTop}
                id={node._attributes.id}
                tabCtx={tabCtx(node, config)}
            >
                {node._attributes.floating ? (
                    <div id="global-elements">
                        <SearchOverlayPopover />
                        <ContextMenu />
                        <InlineSearch />
                        <MobileBar />
                    </div>
                ) : (
                    []
                )}
                <WorkspaceInnerEl config={{ id: config.id, ...(config.viewConfig || {}) }} component={component} />
            </WorkspacePageComponent>
        ) : (
            <WorkspaceInnerEl config={{ id: config.id, ...(config.viewConfig || {}) }} component={component} />
        );
    };

    const [model] = React.useState(FlexLayout.Model.fromJson(json));

    const memoMDFn: any = {};
    const getMouseDownFn = (id: string) => {
        const fn = (event: any) => {
            if (typeof event === 'object') {
                switch (event.button) {
                    case 1:
                        model.doAction(Actions.deleteTab(id));
                        break;
                    default:
                        break;
                }
            }
        };

        if (!memoMDFn[id]) {
            memoMDFn[id] = fn;
        }
        return memoMDFn[id];
    };

    window.layoutModel = model;

    window.wsnavigator = workspaceNavigator.bind(this, model);

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <DndProvider backend={HTML5Backend}>
                <div id="global-elements">
                    <SearchOverlayPopover />
                    <ContextMenu />
                    <InlineSearch />
                    <MobileBar />
                </div>

                <FlexLayout.Layout
                    model={model}
                    factory={factory}
                    popoutURL="./popout_page.html"
                    onAction={(action: Action) => {
                        if (
                            action.type === 'FlexLayout_SelectTab' &&
                            window.localStorage.getItem('enableAnalytics') === 'true'
                        ) {
                            window.mixpanel?.track('selectTab', {
                                component: (window.layoutModel.getNodeById(action.data.tabNode) as any)?._attributes
                                    ?.component,
                            });
                        }
                        return action;
                    }}
                    onRenderTab={(node: TabNode, renderValues: any) => {
                        window.unigraph
                            .getState(`tabs/${(node as any)._attributes.id}/isVisible`)
                            .setValue(node.isVisible());
                        setTitleOnRenderTab(model);
                        const nodeId = node.getId();
                        if (nodeId === 'app-drawer') {
                            renderValues.content = (
                                <Menu
                                    style={{
                                        verticalAlign: 'middle',
                                        transform: 'rotate(90deg)',
                                    }}
                                    key="icon"
                                />
                            );
                        }
                        if (nodeId === 'inspector-pane') {
                            renderValues.content = (
                                <Details
                                    style={{
                                        verticalAlign: 'middle',
                                        transform: 'rotate(270deg)',
                                    }}
                                    key="icon"
                                />
                            );
                        }
                        if (nodeId === 'category-pane') {
                            renderValues.content = [
                                <Icon
                                    path={mdiTagMultipleOutline}
                                    size={1}
                                    style={{ verticalAlign: 'middle' }}
                                    key="icon"
                                />,
                                <Typography
                                    style={{
                                        marginLeft: '4px',
                                        display: 'inline',
                                    }}
                                >
                                    {renderValues.content}
                                </Typography>,
                            ];
                        }
                        renderValues.buttons.push(<div id={`tabId${nodeId}`} key={`tabId${nodeId}`} />);
                        setTimeout(() => {
                            const el = document.getElementById(`tabId${nodeId}`);

                            if (el && el.parentElement && node.isEnableClose()) {
                                const fn = getMouseDownFn(nodeId);
                                el.parentElement.removeEventListener('mousedown', fn);
                                el.parentElement.addEventListener('mousedown', fn);
                            }
                        }, 0);
                    }}
                    onRenderTabSet={(tabSetNode, renderValues) => {
                        if (tabSetNode.getType() === 'tabset') {
                            renderValues.buttons.push(
                                <span
                                    onClick={async () => {
                                        const node: TabNode = tabSetNode.getSelectedNode() as any;
                                        if (node && node.getId() !== 'home') {
                                            const config = node.getConfig();
                                            if (config) {
                                                delete config.undefine;
                                                delete config.id;
                                            }
                                            const uid = await window.unigraph.addObject(
                                                {
                                                    name: node.getName(),
                                                    env: 'react-explorer',
                                                    view: node.getComponent(),
                                                    props: JSON.stringify({
                                                        config: config?.viewConfig || {},
                                                    }),
                                                    $context: {
                                                        _hide: true,
                                                    },
                                                },
                                                '$/schema/view',
                                            );
                                            await window.unigraph.runExecutable(
                                                '$/package/unigraph.core/0.0.1/executable/add-item-to-list',
                                                {
                                                    item: uid[0],
                                                    where: '$/entity/favorite_bar',
                                                },
                                            );
                                        }
                                    }}
                                >
                                    <Icon path={mdiStarPlusOutline} size={0.7} style={{ marginTop: '5px' }} />
                                </span>,
                            );
                        } else if (tabSetNode.getId() === 'border_bottom') {
                            renderValues.buttons.push(
                                <MobileOmnibarIndicator />,
                                <ExecutablesIndicator />,
                                <ConnectionIndicator />,
                            );
                        }
                        if (isElectron() && tabSetNode.getId() === 'border_left') {
                            const getTopLeft = () =>
                                Array.from(document.querySelectorAll('.flexlayout__tabset_tabbar_outer'))
                                    .filter((el) => (el.parentElement || undefined)?.style?.top === '0px')

                                    .sort(
                                        (a, b) =>
                                            parseInt(
                                                // @ts-expect-error: already checked for nullness above
                                                a.parentElement.style.left,
                                                10,
                                            ) -
                                            parseInt(
                                                // @ts-expect-error: already checked for nullness above
                                                b.parentElement.style.left,
                                                10,
                                            ),
                                    )[0];
                            const topLeft = getTopLeft();
                            if (topLeft) {
                                const isLeftOpen =
                                    (model.getNodeById('border_left') as any)._attributes.selected === -1;
                                window.requestAnimationFrame(() => {
                                    const newTopLeft = getTopLeft();
                                    if (isLeftOpen) newTopLeft.classList.add('topleft_bar_with_electron');
                                    else newTopLeft.classList.remove('topleft_bar_with_electron');
                                });
                            }
                        }

                        // renderValues.headerContent = <Button>Hi</Button>;
                    }}
                    classNameMapper={(name) => {
                        if (
                            isElectron() &&
                            (name === 'flexlayout__tab_border_left' || name === 'flexlayout__border_left')
                        ) {
                            return `${name} ${name}_electron`;
                        }
                        return name;
                    }}
                />
            </DndProvider>
        </MuiPickersUtilsProvider>
    );
}
