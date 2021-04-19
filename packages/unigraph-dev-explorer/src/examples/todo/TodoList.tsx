import { Button, Checkbox, Chip, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, TextField } from '@material-ui/core';
import { Delete, LocalOffer, PriorityHigh } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import { DynamicViewRenderer } from '../../global';

import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { getContrast } from '../../utils';
import { withUnigraphSubscription } from 'unigraph-dev-common/lib/api/unigraph-react'

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
        name: todoString,
        done: false,
        priority: priority_num,
        semantic_properties: {
            tags: tags.map(tagName => {return {name: tagName}}),
            notes: []
        }
    }
}

type ATodoList = {
    uid?: string,
    name: string,
    done: boolean,
    priority: number,
    semantic_properties: {
        tags: {uid?: string, color?: string, name: string}[]
        notes: any[]
    }
}

function TodoListBody ({data}: { data: ATodoList[] }) {
    
    const todoList = data;
    const [newName, setNewName] = useState("");

    return <div>
        Hello todo!    <br/>
        There are currently {todoList.length} todo items!   <br/>
        <List>
            {todoList.map(todo => <ListItem button key={todo.uid}>
                <TodoItem data={todo} />
            </ListItem>)}
        </List>
        <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
        <Button onClick={() => window.unigraph.addObject(parseTodoObject(newName), "$/schema/todo")}>Add</Button>
    </div>
}

export const TodoList = withUnigraphSubscription(
    // @ts-ignore
    TodoListBody,
    { schemas: [], defaultData: [], packages: [todoPackage]
    },
    { afterSchemasLoaded: (subsId: number, setData: any) => {
        window.unigraph.subscribeToType("$/schema/todo", (result: ATodoList[]) => {setData(result)}, subsId);
    }}
)

export const TodoItem: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: ATodoList = window.unigraph.unpad(data);
    let totalCallbacks = callbacks || {
        'onUpdate': (data: Record<string, any>) => {
            window.unigraph.updateObject(data.uid, {"done": window.unigraph.unpad(data).done});
        }
    };
    console.log(data.uid, unpadded)
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
            secondary={[...(!unpadded.semantic_properties?.tags?.map ? [] :
                unpadded.semantic_properties?.tags?.map(tag => {
                    const bgc = tag.color?.startsWith('#') ? tag.color : "unset";
                    return <Chip
                        size="small"
                        icon={<LocalOffer/>}
                        style={{
                            backgroundColor: bgc,
                            color: bgc.startsWith("#") ? getContrast(bgc) : "unset"
                        }}
                        label={tag.name}
                    />}
            )), ...(unpadded.priority > 0 ? [<Chip size="small" icon={<PriorityHigh/>} label={"Priority " + unpadded.priority}/>]: [])]}
        />
        <ListItemSecondaryAction>
            <IconButton aria-label="delete" onClick={() => window.unigraph.deleteObject(unpadded.uid!)}>
                <Delete/>
            </IconButton>
        </ListItemSecondaryAction>
    </React.Fragment>
}