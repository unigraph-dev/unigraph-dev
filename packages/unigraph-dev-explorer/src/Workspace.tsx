/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React from "react";

import { components } from './pages';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

import FlexLayout, { Actions, DockLocation, Model, Node, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css'
import './workspace.css'
import { getParameters, isElectron, isSmallScreen, NavigationContext } from "./utils";
import { Button, Container, CssBaseline } from "@material-ui/core";
import { isJsonString } from "unigraph-dev-common/lib/utils/utils";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { Search, StarOutlined, Menu, LocalOffer, Details } from "@material-ui/icons";
import { ContextMenu } from "./components/UnigraphCore/ContextMenu";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend'
import { InlineSearch } from "./components/UnigraphCore/InlineSearchPopup";

import MomentUtils from '@date-io/moment';

import Icon from '@mdi/react'
import { mdiStarPlusOutline, mdiTagMultipleOutline } from '@mdi/js';

const pages = window.unigraph.getState('registry/pages')
const electron = isElectron();

export function WorkspacePageComponent({ children, maximize, paddingTop, id }: any) {
    return <div id={"workspaceContainer"+id} style={{width: "100%", height: "100%", overflow: "auto"}}>
        <Container maxWidth={maximize ? false : "lg"} disableGutters style={{paddingTop: (maximize || !paddingTop) ? "0px" : "12px", height: "100%", display: "flex", flexDirection: "column"}}>
            <CssBaseline/>
            {children}
        </Container>
    </div>
}

export const getComponentFromPage = (location: string, params: any = {}) => {return {
    type: 'tab',
    config: params,
    name: pages.value[location.slice(1)].name,
    component: '/pages' + location,
    enableFloat: 'true'
}}

const ConnectionIndicator = () => {
    const [connected, setConnected] = React.useState(false);
    React.useMemo(() => {
        window.unigraph.getState('unigraph/connected').subscribe((conn) => {
            setConnected(conn)
        })
    }, [])
    return <span style={{height: "16px", width: "16px", borderRadius: "8px", backgroundColor: connected ? "lightgreen" : "red", border: "1px solid grey", marginRight: "8px"}}></span>
}

const newWindowActions = {
    "new-tab": (model: Model, initJson: any) => {
        let newJson = {...initJson, id: getRandomInt().toString()};
        newJson.config = newJson.config || {};
        newJson.config.id = newJson.id;
        model.doAction(Actions.addNode(newJson, "workspace-main-tabset", DockLocation.CENTER, -1));
    },
    "new-pane": (model: Model, initJson: any) => {
        let node = getComponentFromPage(initJson);
        let action = Actions.addNode(node, "workspace-main-tabset", DockLocation.RIGHT, 0, true)
        model.doAction(action);
    },
    "new-popout": (model: Model, initJson: any) => {
        let someId = getRandomInt().toString();
        let node = getComponentFromPage(initJson) as any;
        node.id = someId;
        let action = Actions.addNode(node, "workspace-main-tabset", DockLocation.CENTER, -1, false)
        model.doAction(action);
        model.doAction(Actions.floatTab(someId))
    }
}

const newTab = (model: Model, initJson: any) => {
    // @ts-expect-error: already checked for isJsonString
    let userSettings = JSON.parse(isJsonString(window.localStorage.getItem('userSettings')) ? window.localStorage.getItem('userSettings') : "{}")
    let newWindowBehavior = userSettings['newWindow'] && Object.keys(newWindowActions).includes(userSettings['newWindow']) ? userSettings['newWindow'] : "new-tab"
    // @ts-expect-error: already checked and added fallback
    newWindowActions[newWindowBehavior](model, initJson)
}

window.newTab = newTab;

const workspaceNavigator = (model: Model, location: string) => {
    let search = "?" + location.split('?')[1];
    location = location.split('?')[0];
    newTab(model, getComponentFromPage(location, getParameters(search.slice(1))))
}

const mainTabsetId = 'workspace-main-tabset';

const setTitleOnRenderTab = (model: Model) => {
    // @ts-expect-error: using private API
    const idMap: Record<string, Node> = model._idMap;
    // @ts-expect-error: using private API
    const count = Object.values(idMap).reduce((count, it) => {if (it?._attributes?.type === "tab") return count+1; else return count;}, 0) - 1;
    // @ts-expect-error: using private API
    let selIndex = model.getActiveTabset()?._attributes?.selected;
    selIndex = selIndex ? selIndex : 0
    let selName = "Loading"
    // @ts-expect-error: using private API
    if (model.getActiveTabset() === undefined) {model._setActiveTabset(model.getNodeById(mainTabsetId))}
    try {
        // @ts-expect-error: using private API
        selName = model.getActiveTabset()?._children?.[selIndex]?.getName();
    } catch (e) {}
    const titleStr = `${selName} and ${count-5} other tabs - Unigraph`
    const titleStrZero = `${selName} - Unigraph`
    const finalTitle = count-5 > 0 ? titleStr : titleStrZero
    document.title = finalTitle;
}

export function WorkSpace(this: any) {
    var json = {
        global: {
            "tabSetTabStripHeight": 40,
            "tabEnableRename": false
        },
        borders: [{
		    "type":"border",
            "location": "left",
            "id": "border-left",
            "selected": isSmallScreen() ? -1 : 0,
			"children": [
				{
					"type": "tab",
					"enableClose":false,
                    "minSize": 700,
                    "maxSize": 700,
                    "name": "App Drawer",
                    "id": "app-drawer",
					"component": "/components/appdrawer",
                },
                {
					"type": "tab",
					"enableClose":false,
                    "minSize": 700,
                    "maxSize": 700,
                    "name": "Search",
                    "id": "search-pane",
					"component": "/pages/search",
				}
			]
		}, {
		    "type":"border",
            "location": "bottom",
            "id": "border-bottom",
            "selected": -1,
			"children": [
                {
					"type": "tab",
					"enableClose":false,
                    "minSize": 700,
                    "maxSize": 700,
                    "name": "Categories",
                    "id": "category-pane",
					"component": "/pages/categories",
				}
			]
		}, {
		    "type":"border",
            "location": "right",
            "id": "border-right",
            "selected": -1,
			"children": [
                {
					"type": "tab",
					"enableClose":false,
                    "minSize": 700,
                    "maxSize": 700,
                    "name": "Inspector",
                    "id": "inspector-pane",
					"component": "/pages/inspector",
				}
			]
		}],
        layout:{
            "type": "row",
            "weight": 100,
            "children": [
                {
                    "type": "tabset",
                    "id": mainTabsetId,
                    "enableDeleteWhenEmpty": false,
                    "weight": 50,
                    "selected": 0,
                    "children": [
                        {...getComponentFromPage('/home'), enableClose: false, id: "dashboard", enableDrag: false}
                    ]
                }
            ]
        }
    };

    const factory = (node: any) => {
        var component = node.getComponent();
        var config = node.getConfig() || {};
        if (component.startsWith('/pages/')) {
            const page = pages.value[(component.replace('/pages/', '') as string)]
            return <WorkspacePageComponent maximize={page.maximize} paddingTop={page.paddingTop} id={config.id}>
                {node._attributes.floating ? <div id="global-elements">
                    <ContextMenu />
                    <InlineSearch />
                </div> : []}
                {page.constructor(config)}
            </WorkspacePageComponent>
        } else if (component.startsWith('/components/')) {
            return components[(component.replace('/components/', '') as string)].constructor(config)
        } else if (component.startsWith('/temp/')) {
            const tempComponent = window.unigraph.getState(component).value;
            return tempComponent.component({...config, ...tempComponent.params});
        }
    }

    const [model] = React.useState(FlexLayout.Model.fromJson(json));

    let memoMDFn: any = {}
    const getMouseDownFn = (id: string) => {
        const fn = (event: any) => {
            if (typeof event === 'object') {
                switch (event.button) {
                case 1:
                    model.doAction(Actions.deleteTab(id))
                    break;
                default:
                    break;
                }
            }
        }
 
        if (!memoMDFn[id]) {
            memoMDFn[id] = fn;
        }
        return memoMDFn[id];
    }

    window.layoutModel = model;

    window.wsnavigator = workspaceNavigator.bind(this, model);

    return <NavigationContext.Provider value={workspaceNavigator.bind(this, model)}>
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <div id="global-elements">
                <ContextMenu />
                <InlineSearch />
            </div>
            <DndProvider backend={HTML5Backend}>
                <FlexLayout.Layout model={model} factory={factory} popoutURL={"./popout_page.html"} onRenderTab={(node: TabNode, renderValues: any) => {
                    setTitleOnRenderTab(model);
                    const nodeId = node.getId();
                    if (nodeId === "app-drawer") {
                        renderValues.content = <Menu style={{verticalAlign: "middle", transform: "rotate(90deg)"}} key="icon"/>;
                    }
                    if (nodeId === "search-pane") {
                        renderValues.content = <Search style={{verticalAlign: "middle", transform: "rotate(90deg)"}} key="icon"/>;
                    }
                    if (nodeId === "inspector-pane") {
                        renderValues.content = <Details style={{verticalAlign: "middle", transform: "rotate(270deg)"}} key="icon"/>;
                    }
                    if (nodeId === "category-pane") {
                        renderValues.content = [<Icon path={mdiTagMultipleOutline} size={1} style={{verticalAlign: "middle"}} key="icon"/>, renderValues.content];
                    }
                    renderValues.buttons.push(<div id={"tabId"+nodeId} key={"tabId"+nodeId}></div>);
                    setTimeout(() => {
                        const el = document.getElementById('tabId'+nodeId);
                        
                        if (el && el.parentElement && node.isEnableClose()) {
                            const fn = getMouseDownFn(nodeId);
                            el.parentElement.removeEventListener("mousedown", fn)
                            el.parentElement.addEventListener("mousedown", fn)
                        }
                    }, 0)
                }} onRenderTabSet={(tabSetNode, renderValues) => {
                    if (tabSetNode.getType() === "tabset") {
                        renderValues.buttons.push(<span onClick={async () => {
                            const node: TabNode = tabSetNode.getSelectedNode() as any;
                            if (node && node.getId() !== "dashboard") {
                                const config = node.getConfig();
                                if (config) {delete config.undefine; delete config.id};
                                const uid = await window.unigraph.addObject({
                                    name: node.getName(),
                                    env: "react-explorer",
                                    view: node.getComponent(),
                                    props: JSON.stringify({config: config}) 
                                }, "$/schema/view");
                                await window.unigraph.runExecutable("$/package/unigraph.core/0.0.1/executable/add-item-to-list", {
                                    item: uid[0],
                                    where: "$/entity/favorite_bar"
                                })
                            }
                        }}>
                            <Icon path={mdiStarPlusOutline} size={0.7} style={{marginTop: "5px"}}/>
                        </span>);
                    } else if (tabSetNode.getId() === "border_bottom") {
                        renderValues.buttons.push(<ConnectionIndicator />)
                    }
                    if (isElectron() && tabSetNode.getId() === "border_left") {
                        const getTopLeft = () => Array.from(document.querySelectorAll('.flexlayout__tabset_tabbar_outer'))
                            .filter(el => (el.parentElement || undefined)?.style?.top === "0px")
                            // @ts-expect-error: already checked for nullness above
                            .sort((a, b) => {return parseInt(a.parentElement.style.left) - parseInt(b.parentElement.style.left)})[0];
                        const topLeft = getTopLeft();
                        if (topLeft) {
                            const isLeftOpen = (model.getNodeById('border_left') as any)._attributes.selected === -1;
                            window.requestAnimationFrame(() => {
                                const newTopLeft = getTopLeft();
                                if (isLeftOpen) newTopLeft.classList.add('topleft_bar_with_electron');
                                else newTopLeft.classList.remove('topleft_bar_with_electron');
                            })
                            
                        }
                    }
                    
                    //renderValues.headerContent = <Button>Hi</Button>;
                }} classNameMapper={(name) => {
                    if (isElectron() && (name === "flexlayout__tab_border_left" || name === "flexlayout__border_left")) {
                        return name + " " + name + "_electron";
                    } else return name;
                }}/>
            </DndProvider>
        </MuiPickersUtilsProvider>
    </NavigationContext.Provider>

}