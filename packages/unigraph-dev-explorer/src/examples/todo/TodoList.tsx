import { Button, Checkbox, Chip, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, TextField } from '@material-ui/core';
import { Delete, PriorityHigh } from '@material-ui/icons';
import React, { useState } from 'react';
import { DynamicViewRenderer } from '../../global';

import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { registerDynamicViews, withUnigraphSubscription } from 'unigraph-dev-common/lib/api/unigraph-react'
import { Tag } from '../semantic/Tag';
import { Autocomplete } from '@material-ui/lab';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { AutoDynamicView } from '../../components/ObjectView/DefaultObjectView';

export const parseTodoObject: (arg0: string) => ATodoList = (todoString: string) => {
    // TODO: Using regex for now, we can switch to a more centralized parsing solution later
    let tags_regex = /#[a-zA-Z0-9]*\b ?/gm;
    let tags = todoString.match(tags_regex) || [];
    tags = tags.map(tag => tag.slice(1).trim());
    todoString = todoString.replace(tags_regex, '');

    let priority_regex = /![0-9]\b ?/m;
    let priority = todoString.match(priority_regex) || [];
    let priority_num = parseInt(priority[0]?.slice(1)) || 0
    todoString = todoString.replace(priority_regex, '');

    return {
        name: {type: {"unigraph.id": "$/schema/markdown"}, _value: todoString},
        done: false,
        priority: priority_num,
        semantic_properties: {
            children: tags.map(tagName => {return {name: tagName}})
        }
    }
}

type ATodoList = {
    uid?: string,
    name: string | any,
    done: boolean,
    priority: number,
    semantic_properties: {
        children: any[]
    }
}

const filterFns = {
    "no-filter": (objs: any[]) => objs,
    "only-incomplete": (objs: any[]) => objs.filter(obj => {
        let r;
        try {r = unpad(obj)['done'] === false}
        catch (e) {r=false};
        return r;
    }),
    "only-complete": (objs: any[]) => objs.filter(obj => {
        let r;
        try {r = unpad(obj)['done'] === true}
        catch (e) {r=false};
        return r;
    }),
    "high-priority": (objs: any[]) => objs.filter(obj => {
        let r;
        try {r = unpad(obj)['priority'] >= 1}
        catch (e) {r=false};
        return r;
    })
}

function TodoListBody ({data}: { data: ATodoList[] }) {
    
    const todoList = data;
    const [newName, setNewName] = useState("");

    const [filteredItems, setFilteredItems] = React.useState(todoList);
    const [filterName, setFilterName] = React.useState(["no-filter"]);

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
        <Button onClick={() => window.unigraph.addObject(parseTodoObject(newName), "$/schema/todo")}>Add</Button>
    </div>
}

export const TodoItem: DynamicViewRenderer = ({data, callbacks}) => {
    //console.log(data);
    let unpadded: ATodoList = unpad(data);
    //console.log(unpadded)
    let totalCallbacks = {...(callbacks || {}), 
        'onUpdate': (data: Record<string, any>) => {
            window.unigraph.updateObject(data.uid, {"done": unpad(data).done});
        }
    };
    //console.log(data.uid, unpadded)
    return <React.Fragment>
        <ListItemIcon>
            <Checkbox checked={unpadded.done} onClick={_ => {
                //window.unigraph.updateSimpleObject(todo, "done", !unpadded.done);
                data['_value']['done']['_value.!'] = !data['_value']['done']['_value.!'];
                totalCallbacks['onUpdate'](data);
            }} />
        </ListItemIcon>
        <ListItemText 
            primary={unpadded.name}
            secondary={[...(!unpadded.semantic_properties?.children?.map ? [] :
                unpadded.semantic_properties?.children?.map(it => <Tag data={it}/>
            )), ...(unpadded.priority > 0 ? [<Chip size="small" icon={<PriorityHigh/>} label={"Priority " + unpadded.priority}/>]: [])]}
        />
        <ListItemSecondaryAction>
            <IconButton aria-label="delete" onClick={() => window.unigraph.deleteObject(unpadded.uid!)}>
                <Delete/>
            </IconButton>
        </ListItemSecondaryAction>
    </React.Fragment>
}

registerDynamicViews({"$/schema/todo": TodoItem})

export const TodoList = withUnigraphSubscription( 
    // @ts-ignore
    TodoListBody,
    { schemas: [], defaultData: Array(10).fill({'type': {'unigraph.id': '$/skeleton/default'}}), packages: [todoPackage]
    },
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/todo", (result: ATodoList[]) => {setData(result)}, subsId);
    }}
)