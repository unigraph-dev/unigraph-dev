/**
 * Unigraph-workspace: an experimental multiwindow workspace for Unigraph
 */

import React from "react";

import { pages, components } from './App';

import FlexLayout, { Actions, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css'
import './workspace.css'
import { NavigationContext } from "./utils";

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

    const factory = (node: { getComponent: () => any; getName: () => boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; }) => {
        var component = node.getComponent();
        if (component.startsWith('/pages/')) {
            return pages[(component.replace('/pages/', '') as string)]
        } else if (component.startsWith('/components/')) {
            return components[(component.replace('/components/', '') as string)]
        }
    }

    const getComponentFromPage = (location: string) => {return {
        type: 'tab',
        name: 'New Page',
        component: '/pages' + location,
        enableFloat: 'true'
    }}

    const [model, setModel] = React.useState(FlexLayout.Model.fromJson(json));

    return <NavigationContext.Provider value={(location: string) => {
        model.doAction(Actions.addNode(getComponentFromPage(location), "workspace-main-tabset", DockLocation.CENTER, 0))
    }}>
        <FlexLayout.Layout model={model} factory={factory}/>
    </NavigationContext.Provider>

}