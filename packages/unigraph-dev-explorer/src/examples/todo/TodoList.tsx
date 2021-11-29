import { Button, Checkbox, Chip, ListItemIcon, ListItemText, TextField, Typography } from '@material-ui/core';
import { CalendarToday, PriorityHigh } from '@material-ui/icons';
import React, { useState } from 'react';
import { DynamicViewRenderer } from '../../global';

import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { registerDynamicViews, registerQuickAdder, withUnigraphSubscription } from '../../unigraph-react'
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import Sugar from 'sugar';
import { parseTodoObject } from './parseTodoObject';
import { ATodoList, filters, maxDateStamp } from './utils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';

function TodoListBody ({data}: { data: ATodoList[] }) {
    const todoList = data;
    const [newName, setNewName] = useState("");

    const [filteredItems, setFilteredItems] = React.useState(todoList);

    React.useEffect(() => {
        let res = todoList;
        setFilteredItems(res)
    }, [todoList]) 

    return <div>
        <DynamicObjectListView 
            items={filteredItems}
            context={null}
            filters={filters}
            defaultFilter={"only-incomplete"}
            compact
        />
        <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
        <Button onClick={
            () => window.unigraph.addObject(parseTodoObject(newName), "$/schema/todo")
            //() => console.log(parseTodoObject(newName))
        }>Add</Button>
    </div>
}

export const TodoItem: DynamicViewRenderer = ({data, callbacks}) => {
    //console.log(data);
    let unpadded: ATodoList = unpad(data);
    //console.log(unpadded)
    let totalCallbacks = {...(callbacks || {}), 
        'onUpdate': (data: Record<string, any>) => {
            window.unigraph.updateObject(data.uid, {
                "_value": {
                    "done": { "_value.!": data.get('done')['_value.!'] },
                },
                "_hide": data.get('done')['_value.!']
            }, true, false);
        }
    };
    //console.log(data.uid, unpadded)
    return <div style={{display: "flex"}}>
            <Checkbox checked={unpadded.done} onClick={_ => {
                //window.unigraph.updateSimpleObject(todo, "done", !unpadded.done);
                data.get('done')['_value.!'] = !data.get('done')['_value.!'];
                totalCallbacks['onUpdate'](data);
            }} />
        <ListItemText 
            primary={<AutoDynamicView object={data.get('name')['_value']['_value']} noDrag noDrop noContextMenu />}
            secondary={<div style={{display: "flex", alignItems: "baseline"}} children={[...(!unpadded.children?.map ? [] :
                data?.['_value']?.children?.['_value[']?.map((it: any) => <AutoDynamicView object={it['_value']?.['_value']} inline/>
            )), ...(unpadded.priority > 0 ? [<Chip size="small" icon={<PriorityHigh/>} label={"Priority " + unpadded.priority}/>]: []),
            ...(unpadded.time_frame?.start?.datetime && (new Date(unpadded.time_frame?.start?.datetime)).getTime() !== 0 ? [<Chip size="small" icon={<CalendarToday/>} label={"Start: " + Sugar.Date.relative(new Date(unpadded.time_frame?.start?.datetime))} />] : []),
            ...(unpadded.time_frame?.end?.datetime && (new Date(unpadded.time_frame?.start?.datetime)).getTime() !== maxDateStamp ? [<Chip size="small" icon={<CalendarToday/>} label={"End: " + Sugar.Date.relative(new Date(unpadded.time_frame?.end?.datetime))} />] : [])]}></div>}
        />
    </div>
}

registerDynamicViews({"$/schema/todo": TodoItem})

const quickAdder = async (inputStr: string, preview = true) => {
    const parsed = parseTodoObject(inputStr);
    if (!preview) return await window.unigraph.addObject(parsed, "$/schema/todo");
    else return [parsed, '$/schema/todo'];
}

const tt = () => <React.Fragment>
    <Typography style={{color: "gray"}}>Examples:</Typography>
    <Typography>@tomorrow-"next Friday" #unigraph hello world</Typography>
    <Typography style={{color: "gray"}} variant="body2">doable from tomorrow, due next Friday</Typography>
    <Typography>@tomorrow #unigraph hello world</Typography>
    <Typography style={{color: "gray"}} variant="body2">due tomorrow</Typography>
    <Typography>!5 very important stuff</Typography>
    <Typography style={{color: "gray"}} variant="body2">priority 5</Typography>
</React.Fragment>

registerQuickAdder({'todo': {adder: quickAdder, tooltip: tt}, 'td': {adder: quickAdder, tooltip: tt}})

export const TodoList = withUnigraphSubscription( 
    // @ts-ignore
    TodoListBody,
    { schemas: [], defaultData: [], packages: [todoPackage]
    },
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/todo", (result: ATodoList[]) => {setData(result)}, subsId, {all: undefined});
    }}
)