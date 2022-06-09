/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React from 'react';

import LocalizationProvider from '@mui/lab/LocalizationProvider';

import { Action, Actions, DockLocation, Model, Node, TabNode, Layout } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import './workspace.css';
import { Container, CssBaseline, ListItem, Popover, Typography } from '@mui/material';
import { ThemeProvider, Theme, StyledEngineProvider, createTheme } from '@mui/material/styles';

import { isJsonString } from 'unigraph-dev-common/lib/utils/utils';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { Menu, Details, Home } from '@mui/icons-material';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';

import MomentUtils from '@date-io/moment';
// or @mui/lab/Adapter{Dayjs,Luxon,Moment} or any valid date-io adapter
// import AdapterDateFns from '@mui/lab/AdapterDateFns';
import AdapterMoment from '@mui/lab/AdapterMoment';

import Icon from '@mdi/react';
import { mdiFormTextarea, mdiStarPlusOutline, mdiSync, mdiTagMultipleOutline } from '@mdi/js';
import _ from 'lodash';
import { styled } from '@mui/styles';
import { components } from './pages';
import { InlineSearch } from './components/UnigraphCore/InlineSearchPopup';
import { ContextMenu } from './components/UnigraphCore/ContextMenu';
import { getComponentFromPage, getParameters, globalTheme, isElectron, isSmallScreen, TabContext } from './utils';
import { SearchOverlayPopover } from './pages/SearchOverlay';
import { MobileBar } from './components/UnigraphCore/MobileBar';
import { CustomDragLayer } from './CustomDragLayer';
import { AuthPrompt } from './pages/AuthPrompt';
import { useUnigraphState } from './unigraph-react';

export function WorkspacePageComponent({ children, maximize, paddingTop, id, tabCtx, view }: any) {
    // const [_maximize, setMaximize] = React.useState(maximize);
    // tabCtx.setMaximize = (val: boolean) => {
    //     setMaximize(val);
    // };
    const memoTabCtx = React.useMemo(() => tabCtx, [id]);

    return (
        <TabContext.Provider value={memoTabCtx}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    paddingTop: maximize || !paddingTop ? '0px' : '12px',
                }}
                id={`workspaceFrame${id}`}
                className={`workspace-frame workspace-frame-${view}`}
            >
                <Container
                    maxWidth={maximize ? false : 'lg'}
                    id={`workspaceContainer${id}`}
                    className="workspace-container"
                    disableGutters
                    style={{
                        paddingTop: maximize || !paddingTop ? '0px' : '12px',
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
    const connected = useUnigraphState('unigraph/connected');
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
    let selId = '';

    if (model.getActiveTabset() === undefined) {
        // @ts-expect-error: using private API
        model._setActiveTabset(model.getNodeById(mainTabsetId));
    }
    try {
        // @ts-expect-error: using private API
        selName = model.getActiveTabset()?._children?.[selIndex]?.getName();
        // @ts-expect-error: using private API
        selId = model.getActiveTabset()?._children?.[selIndex]?._attributes.id;
    } catch (e) {
        return;
    }
    const titleStr = `${selName} and ${count - 3} other tabs - Unigraph`;
    const titleStrZero = `${selName} - Unigraph`;
    const finalTitle = count - 3 > 0 ? titleStr : titleStrZero;
    document.title = finalTitle;
    window.unigraph.getState('global/activeTab').setValue(selId);
};

const providedTheme = createTheme(globalTheme);

const dndOpts = {
    enableMouseEvents: true,
    delayTouchStart: 500,
    ignoreContextMenu: true,
};

export function WorkSpace(this: any) {
    const homePage = JSON.parse(window.localStorage.getItem('userSettings') || '')?.homePage || 'home';

    const json: any = {
        global: {
            tabSetTabStripHeight: 40,
            tabEnableRename: false,
            splitterSize: 1,
            splitterExtra: 12,
            tabEnableRenderOnDemand: true,
            enableUseVisibility: true,
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
            /* {
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
             }, */
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
                            ...getComponentFromPage(`/${homePage}`),
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
            setTitle: (title: string, icon?: any, renamerId?: string) => {
                // @ts-expect-error: using private API
                const currNode = window.layoutModel.getNodeById(node._attributes.id);
                // @ts-expect-error: using private API
                const curRenamer = currNode._attributes.config?.renamerId;
                if (config.customTitle || !title?.length || (curRenamer && curRenamer !== renamerId)) {
                    return false;
                }
                return window.layoutModel.doAction(
                    // @ts-expect-error: using private API
                    Actions.updateNodeAttributes(node._attributes.id, {
                        name: title,
                        ...(icon ? { icon } : {}),
                        // @ts-expect-error: using private API
                        config: { ...currNode._attributes.config, renamerId },
                    }),
                );
            },
            setMaximize: (val: boolean) => false,
            isVisible: () =>
                // @ts-expect-error: using private API
                window.layoutModel.getNodeById(node._attributes.id)?.isVisible(),

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
                view={component}
            >
                {node._attributes.floating ? (
                    <div id="global-elements" className="lol1">
                        <ContextMenu window={node._window ?? window} />
                        <InlineSearch window={node._window ?? window} />
                    </div>
                ) : (
                    []
                )}
                <WorkspaceInnerEl
                    config={{ id: config.id, ...(config.viewConfig || {}) }}
                    component={component}
                    key="innerEl"
                />
            </WorkspacePageComponent>
        ) : (
            <WorkspaceInnerEl config={{ id: config.id, ...(config.viewConfig || {}) }} component={component} />
        );
    };

    // Monitor changes in stylesheets and update popout windows if necessary
    React.useEffect(() => {
        new MutationObserver((mutationCallback) => {
            const popoutWindows: Window[] = [];
            window.layoutModel.visitNodes((node) => {
                if ((node as any)._window) popoutWindows.push((node as any)._window);
            });
            if (!popoutWindows.length) return;

            const el = document.createElement('style');
            el.id = 'unigraph-popout-inherited-styles';
            for (const styleSheet of document.styleSheets) {
                if (styleSheet.href) {
                    // prefer links since they will keep paths to images etc
                    const styleElement = document.createElement('link');
                    styleElement.type = styleSheet.type;
                    styleElement.rel = 'stylesheet';
                    styleElement.href = styleSheet.href;
                    el.appendChild(styleElement);
                } else if (styleSheet.rules) {
                    const style = document.createElement('style');
                    for (const rule of styleSheet.rules) {
                        style.appendChild(document.createTextNode(rule.cssText));
                    }
                    el.appendChild(style);
                }
            }

            for (const window of popoutWindows) {
                const elem = window.document.getElementById('unigraph-popout-inherited-styles');
                if (elem) window.document.head.replaceChild(el, elem);
            }
        }).observe(document, {
            childList: true,
            subtree: true,
        });
    }, []);

    // Monkey patch getElementById to get elements from popouts too
    React.useLayoutEffect(() => {
        const oldGetElementById = document.getElementById.bind(document);

        document.getElementById = (id: string) => {
            const res = oldGetElementById(id);
            if (res) return res;
            const popoutWindows: Window[] = [];
            window.layoutModel.visitNodes((node) => {
                if ((node as any)._window) popoutWindows.push((node as any)._window);
            });
            if (!popoutWindows.length) return res;
            for (const ww of popoutWindows) {
                const windowRes = ww.document.getElementById(id);
                if (windowRes) return windowRes;
            }
            return res;
        };
    }, []);

    const [model] = React.useState(Model.fromJson(json));

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
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={providedTheme}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DndProvider backend={TouchBackend} options={dndOpts}>
                        <CustomDragLayer />
                        <div id="global-elements" className="lol1">
                            <AuthPrompt />
                            <SearchOverlayPopover />
                            <ContextMenu />
                            <InlineSearch />
                            <MobileBar />
                        </div>

                        <Layout
                            model={model}
                            factory={factory}
                            popoutURL="./popout_page.html"
                            iconFactory={() => '' as any}
                            onAction={(action: Action) => {
                                if (
                                    action.type === 'FlexLayout_SelectTab' &&
                                    window.localStorage.getItem('enableAnalytics') === 'true'
                                ) {
                                    console.log('hihihi');
                                    window.mixpanel?.track('selectTab', {
                                        component: (window.layoutModel.getNodeById(action.data.tabNode) as any)
                                            ?._attributes?.component,
                                    });
                                } else if (
                                    action.type === 'FlexLayout_DeleteTab' &&
                                    action.data.animationShown !== true
                                ) {
                                    console.log('Closing');
                                    const tabEl = document.getElementById(`tabId${action.data.node}`)?.parentElement;
                                    tabEl?.classList.remove('rendered_tab_button');
                                    setTimeout(() => {
                                        model.doAction({ ...action, data: { ...action.data, animationShown: true } });
                                    }, 200);
                                    return undefined;
                                }
                                return action;
                            }}
                            onRenderTab={(node: TabNode, renderValues: any) => {
                                window.unigraph
                                    .getState(`tabs/${(node as any)._attributes.id}/isVisible`)
                                    .setValue(node.isVisible());
                                setTitleOnRenderTab(model);
                                const nodeId = node.getId();
                                const nodeIcon = node.getIcon();
                                if (nodeId === 'app-drawer') {
                                    renderValues.leading = (
                                        <Menu
                                            style={{
                                                verticalAlign: 'middle',
                                                transform: 'rotate(90deg)',
                                            }}
                                            key="icon"
                                        />
                                    );
                                    renderValues.content = '';
                                }
                                if (nodeId === 'inspector-pane') {
                                    renderValues.leading = (
                                        <Details
                                            style={{
                                                verticalAlign: 'middle',
                                                transform: 'rotate(270deg)',
                                            }}
                                            key="icon"
                                        />
                                    );
                                    renderValues.content = '';
                                }
                                if (nodeId === 'category-pane') {
                                    renderValues.leading = (
                                        <Icon
                                            path={mdiTagMultipleOutline}
                                            size={1}
                                            style={{ verticalAlign: 'middle' }}
                                            key="icon"
                                        />
                                    );
                                    renderValues.content = [
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
                                if (!renderValues.leading && typeof nodeIcon === 'string') {
                                    // Render icon
                                    if (/^\p{Extended_Pictographic}$/u.test(nodeIcon)) {
                                        // is emoji
                                        renderValues.leading = nodeIcon;
                                    } else {
                                        // is svg icon
                                        // TODO
                                        renderValues.leading = (
                                            <div
                                                style={{
                                                    minWidth: '16px',
                                                    minHeight: '16px',
                                                    backgroundImage: `url("${
                                                        nodeIcon.startsWith('data:image/svg+xml,')
                                                            ? ''
                                                            : 'data:image/svg+xml,'
                                                    }${nodeIcon}")`,
                                                    opacity: 0.54,
                                                }}
                                            />
                                        );
                                    }
                                }
                                const isFirstRender = !document.getElementById(`tabId${nodeId}`);
                                renderValues.buttons.push(<div id={`tabId${nodeId}`} key={`tabId${nodeId}`} />);
                                setTimeout(() => {
                                    const el = document.getElementById(`tabId${nodeId}`);

                                    if (el && el.parentElement && node.isEnableClose()) {
                                        const fn = getMouseDownFn(nodeId);
                                        el.parentElement.removeEventListener('mousedown', fn);
                                        el.parentElement.addEventListener('mousedown', fn);
                                    }
                                }, 0);
                                window.queueMicrotask(() => {
                                    const el = document.getElementById(`tabId${nodeId}`);

                                    if (el && el.parentElement && !isFirstRender) {
                                        el.parentElement.classList.add('rendered_tab_button');
                                    }
                                });
                                setTimeout(() => {
                                    const el = document.getElementById(`tabId${nodeId}`);

                                    if (el && el.parentElement && isFirstRender) {
                                        el.parentElement.classList.add('rendered_tab_button');
                                    }
                                });
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
                                                    const uid = (window.unigraph as any).leaseUid();
                                                    window.unigraph.addObject(
                                                        {
                                                            uid,
                                                            name: node.getName(),
                                                            icon: node.getIcon(),
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
                                                        undefined,
                                                        [],
                                                    );
                                                    await window.unigraph.runExecutable(
                                                        '$/executable/add-item-to-list',
                                                        {
                                                            item: uid,
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
                </LocalizationProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
}
