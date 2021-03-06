/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React, { ReactElement } from "react";

import { components } from './App';

import FlexLayout, { Actions, DockLocation, Model, Node, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css'
import './workspace.css'
import { getParameters, NavigationContext } from "./utils";
import { Button, Container, CssBaseline } from "@material-ui/core";
import { isJsonString } from "unigraph-dev-common/lib/utils/utils";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { Search, Star, StarOutlined, Menu } from "@material-ui/icons";
import { ContextMenu } from "./components/UnigraphCore/ContextMenu";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend'

const pages = window.unigraph.getState('registry/pages')

export function WorkspacePageComponent({ children, maximize }: any) {
    console.log(maximize)
    return <Container maxWidth={maximize ? false : "lg"} disableGutters style={{paddingTop: maximize ? "0px" : "12px", height: "100%"}}>
        <CssBaseline/>
        {children}
    </Container>
}

export const getComponentFromPage = (location: string, params: any = {}) => {return {
    type: 'tab',
    config: params,
    name: pages.value[location.slice(1)].name,
    component: '/pages' + location,
    enableFloat: 'true'
}}

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
        let newNode = model.doAction(action);
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
    const titleStr = `${selName} and ${count-2} other tabs - Unigraph`
    const titleStrZero = `${selName} - Unigraph`
    const finalTitle = count-2 ? titleStr : titleStrZero
    document.title = finalTitle;
}

export function WorkSpace(this: any) {
    var json = {
        global: {
            "tabSetTabStripHeight": 40
        },
        borders: [{
		    "type":"border",
            "location": "left",
            "id": "border-left",
            "selected": 0,
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
		}],
        layout:{
            "type": "row",
            "weight": 100,
            "children": [
                {
                    "type": "tabset",
                    "id": mainTabsetId,
                    "weight": 50,
                    "selected": 0,
                    "children": [
                        {...getComponentFromPage('/home'), enableClose: false, id: "dashboard"}
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
            console.log(page)
            return <WorkspacePageComponent maximize={page.maximize}>
                {page.constructor(config)}
            </WorkspacePageComponent>
        } else if (component.startsWith('/components/')) {
            return components[(component.replace('/components/', '') as string)].constructor(config)
        }
    }

    const [model, setModel] = React.useState(FlexLayout.Model.fromJson(json));

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
        <div id="global-elements">
            <ContextMenu />
        </div>
        <DndProvider backend={HTML5Backend}>
            <FlexLayout.Layout model={model} factory={factory} popoutURL={"./popout_page.html"} onRenderTab={(node: TabNode, renderValues: any) => {
                setTitleOnRenderTab(model);
                const nodeId = node.getId();
                if (nodeId === "app-drawer") {
                    renderValues.content = <Menu/>;
                }
                if (nodeId === "search-pane") {
                    renderValues.content = <Search/>;
                }
                if (node.isVisible() && nodeId !== "app-drawer" && nodeId !== "dashboard" && nodeId !== "search-pane") {
                    renderValues.buttons.push(<div style={{zIndex: 999, transform: "scale(0.7)"}} onClick={async () => {
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
                    }}><StarOutlined></StarOutlined></div>) 
                }
                
                renderValues.buttons.push(<div id={"tabId"+nodeId}></div>);
                setTimeout(() => {
                    const el = document.getElementById('tabId'+nodeId);
                    
                    if (el && el.parentElement && node.isEnableClose()) {
                        const fn = getMouseDownFn(nodeId);
                        el.parentElement.removeEventListener("mousedown", fn)
                        el.parentElement.addEventListener("mousedown", fn)
                    }
                }, 0)
            }}/>
        </DndProvider>
    </NavigationContext.Provider>

}