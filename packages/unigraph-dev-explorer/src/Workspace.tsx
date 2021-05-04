/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React, { ReactElement } from "react";

import { pages, components } from './App';

import FlexLayout, { Actions, DockLocation, Model, Node } from 'flexlayout-react';
import 'flexlayout-react/style/light.css'
import './workspace.css'
import { getParameters, NavigationContext } from "./utils";
import { Container, CssBaseline } from "@material-ui/core";
import { isJsonString } from "unigraph-dev-common/lib/utils/utils";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";

export function WorkspacePageComponent({ children }: any) {
    return <Container maxWidth="lg" disableGutters style={{paddingTop: "12px"}}>
        <CssBaseline/>
        {children}
    </Container>
}

const getComponentFromPage = (location: string, params: any = {}) => {return {
    type: 'tab',
    config: params,
    name: pages[location.slice(1)].name,
    component: '/pages' + location,
    enableFloat: 'true'
}}

const newWindowActions = {
    "new-tab": (model: Model, location: string, search: string) => model.doAction(Actions.addNode(getComponentFromPage(location, getParameters(search)), "workspace-main-tabset", DockLocation.CENTER, -1)),
    "new-pane": (model: Model, location: string, search: string) => {
        let node = getComponentFromPage(location, getParameters(search));
        let action = Actions.addNode(node, "workspace-main-tabset", DockLocation.RIGHT, 0, true)
        model.doAction(action);
    },
    "new-popout": (model: Model, location: string, search: string) => {
        let someId = getRandomInt().toString();
        let node = getComponentFromPage(location, getParameters(search)) as any;
        node.id = someId;
        console.log(model)
        let action = Actions.addNode(node, "workspace-main-tabset", DockLocation.CENTER, -1, false)
        let newNode = model.doAction(action);
        model.doAction(Actions.floatTab(someId))
    }
}

const workspaceNavigator = (model: Model, location: string) => {
    // @ts-expect-error: already checked for isJsonString
    let userSettings = JSON.parse(isJsonString(window.localStorage.getItem('userSettings')) ? window.localStorage.getItem('userSettings') : "{}")
    let newWindowBehavior = userSettings['new-window'] && Object.keys(newWindowActions).includes(userSettings['new-window']) ? userSettings['new-window'] : "new-tab"

    let search = "?" + location.split('?')[1];
    location = location.split('?')[0];
    // @ts-expect-error: already checked and added fallback
    newWindowActions[newWindowBehavior](model, location, search)
}

const mainTabsetId = 'workspace-main-tabset';

const onRenderTab = (model: Model) => {
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
    const titleStr = `${selName} and ${count-1} other tabs - Unigraph`
    const titleStrZero = `${selName} - Unigraph`
    const finalTitle = count-1 ? titleStr : titleStrZero
    document.title = finalTitle;
}

export function WorkSpace(this: any) {
    var json = {
        global: {},
        borders: [{
		    "type":"border",
            "location": "left",
            "id": "border-left",
            "selected": 0,
			"children": [
				{
					"type": "tab",
					"enableClose":false,
                    "minSize": 540,
                    
					"name": "App Drawer",
					"component": "/components/appdrawer",
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
                        {
                            "type": "tab",
                            "name": "Home",
                            "component":"/pages/home",
                            "enableFloat": "true",
                            "enableClose":false,
                        }
                    ]
                }
            ]
        }
    };

    const factory = (node: any) => {
        var component = node.getComponent();
        var config = node.getConfig() || {};
        if (component.startsWith('/pages/')) {
            return <WorkspacePageComponent>
                {pages[(component.replace('/pages/', '') as string)].constructor(config)}
            </WorkspacePageComponent>
        } else if (component.startsWith('/components/')) {
            return components[(component.replace('/components/', '') as string)].constructor(config)
        }
    }

    const [model, setModel] = React.useState(FlexLayout.Model.fromJson(json));

    window.layoutModel = model;

    return <NavigationContext.Provider value={workspaceNavigator.bind(this, model)}>
        <FlexLayout.Layout model={model} factory={factory} popoutURL={"./popout_page.html"} onRenderTab={() => onRenderTab(model)}/>
    </NavigationContext.Provider>

}