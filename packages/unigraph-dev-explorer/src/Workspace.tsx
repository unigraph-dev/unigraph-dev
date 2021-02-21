/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React from "react";

import { pages, components } from './App';

import FlexLayout, { Actions, DockLocation, Node } from 'flexlayout-react';
import 'flexlayout-react/style/light.css'
import './workspace.css'
import { getParameters, NavigationContext } from "./utils";

export function WorkSpace() {
    // TODO: Complete workspace init
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
        console.log(node)
        var component = node.getComponent();
        var config = node.getConfig() || {};
        if (component.startsWith('/pages/')) {
            return pages[(component.replace('/pages/', '') as string)](config)
        } else if (component.startsWith('/components/')) {
            return components[(component.replace('/components/', '') as string)](config)
        }
    }

    const getComponentFromPage = (location: string, params: any = {}) => {return {
        type: 'tab',
        config: params,
        name: 'New Page',
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