/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React, { ReactElement } from "react";

import { pages, components } from './App';

import FlexLayout, { Actions, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css'
import './workspace.css'
import { getParameters, NavigationContext } from "./utils";
import { CssBaseline } from "@material-ui/core";

export function WorkspacePageComponent({ children }: any) {
    return <div>
        <CssBaseline/>
        {children}
    </div>
}

export function WorkSpace() {
    var json = {
        global: {},
        borders: [{
		    "type":"border",
		 	"location": "left",
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
                    "id": "workspace-main-tabset",
                    "weight": 50,
                    "selected": 0,
                    "children": [
                        {
                            "type": "tab",
                            "name": "Home",
                            "component":"/pages/home",
                            "enableFloat": "true"
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

    const getComponentFromPage = (location: string, params: any = {}) => {return {
        type: 'tab',
        config: params,
        name: pages[location.slice(1)].name,
        component: '/pages' + location,
        enableFloat: 'true'
    }}

    const [model, setModel] = React.useState(FlexLayout.Model.fromJson(json));

    return <NavigationContext.Provider value={(location: string) => {
        let search = "?" + location.split('?')[1];
        location = location.split('?')[0];
        model.doAction(Actions.addNode(getComponentFromPage(location, getParameters(search)), "workspace-main-tabset", DockLocation.CENTER, 0))
    }}>
        <FlexLayout.Layout model={model} factory={factory}/>
    </NavigationContext.Provider>

}