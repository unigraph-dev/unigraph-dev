import { Button, Checkbox, Chip, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, TextField } from '@material-ui/core';
import { CalendarToday, Delete, PriorityHigh } from '@material-ui/icons';
import React, { useState } from 'react';
import { DynamicViewRenderer } from '../../global';

import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { registerDynamicViews, withUnigraphSubscription } from 'unigraph-dev-common/lib/api/unigraph-react'
import { Tag } from '../semantic/Tag';
import { Autocomplete } from '@material-ui/lab';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { AutoDynamicView } from '../../components/ObjectView/DefaultObjectView';
import Sugar from 'sugar';
import { parseTodoObject } from './parseTodoObject';
import { ATodoList, filterFns, maxDateStamp } from './utils';



function TodoListBody ({data}: { data: ATodoList[] }) {
    const todoList = data;
    const [newName, setNewName] = useState("");

    const [filteredItems, setFilteredItems] = React.useState(todoList);
    const [filterName, setFilterName] = React.useState(["only-incomplete"]);

    React.useEffect(() => {
        let res = todoList;
        filterName.forEach(name => {
            if (name && Object.keys(filterFns).includes(name)) // @ts-ignore: already accounted for
            res = filterFns[name](res)
        });
        setFilteredItems(res)
    }, [filterName, todoList]) 

    return <div>
        <Autocomplete
            multiple
            value={filterName}
            onChange={(event, newValue) => {
                setFilterName(newValue)
            }}
            id="filter-selector"
            options={Object.keys(filterFns)}
            style={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Filter presets" variant="outlined" />}
        />
        <List>
            {filteredItems.map(todo => <ListItem button key={todo.uid}>
                <AutoDynamicView object={todo} />
            </ListItem>)}
        </List>
        <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
        <Button onClick={
            () => window.unigraph.addObject(parseTodoObject(newName), "$/schema/todo")
            //() => console.log(parseTodoObject(newName))
        }>Add</Button>
        <p>
            Examples: <br/>
            @tomorrow-"next Friday" #unigraph hello world     // doable from tomorrow, due next Friday<br/>
            @tomorrow #unigraph hello world     // due tomorrow<br/>
            !5 very important stuff     // priority 5
        </p>
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
    return <React.Fragment>
        <ListItemIcon>
            <Checkbox checked={unpadded.done} onClick={_ => {
                //window.unigraph.updateSimpleObject(todo, "done", !unpadded.done);
                data.get('done')['_value.!'] = !data.get('done')['_value.!'];
                totalCallbacks['onUpdate'](data);
            }} />
        </ListItemIcon>
        <ListItemText 
            primary={<AutoDynamicView object={data.get('name')['_value']['_value']} noDrag noDrop noContextMenu />}
            secondary={[...(!unpadded.semantic_properties?.children?.map ? [] :
                unpadded.semantic_properties?.children?.map(it => <Tag data={it}/>
            )), ...(unpadded.priority > 0 ? [<Chip size="small" icon={<PriorityHigh/>} label={"Priority " + unpadded.priority}/>]: []),
            ...(unpadded.time_frame?.start && (new Date(unpadded.time_frame?.start)).getTime() !== 0 ? [<Chip size="small" icon={<CalendarToday/>} label={"Start: " + Sugar.Date.relative(new Date(unpadded.time_frame?.start))} />] : []),
            ...(unpadded.time_frame?.end && (new Date(unpadded.time_frame?.start)).getTime() !== maxDateStamp ? [<Chip size="small" icon={<CalendarToday/>} label={"End: " + Sugar.Date.relative(new Date(unpadded.time_frame?.end))} />] : [])]}
        />
    </React.Fragment>
}

registerDynamicViews({"$/schema/todo": TodoItem})

export const TodoList = withUnigraphSubscription( 
    // @ts-ignore
    TodoListBody,
    { schemas: [], defaultData: [], packages: [todoPackage]
    },
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/todo", (result: ATodoList[]) => {setData(result)}, subsId, undefined, true);
    }}
)