import { Button, Checkbox, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, TextField } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import { useVideo } from 'react-use';
import { makeUnigraphId, makeRefUnigraphId } from '../../unigraph';

// Define the todo schema for ensurance
let schemaTodo = {
    ...makeUnigraphId("$/schema/todo"),
    "dgraph.type": "Type",
    "definition": {
        "type": makeRefUnigraphId("$/composer/Object"),
        "parameters": {
            "indexedBy": makeRefUnigraphId("$/primitive/string"),
            "indexes": ["name"]
        },
        "properties": [
            {
                "key": "name",
                "definition": {
                    "type": makeRefUnigraphId("$/primitive/string")
                }
            },
            {
                "key": "done",
                "definition": {
                    "type": makeRefUnigraphId("$/primitive/boolean")
                }
            },
            {
                "key": "users",
                "definition": {
                    "type": makeRefUnigraphId("$/composer/Array"),
                    "parameters": {
                        "element": {"type": makeRefUnigraphId("$/schema/user")}
                    }
                }
            }
        ]
    }
}

let schemaUser = {
    ...makeUnigraphId("$/schema/user"),
    "dgraph.type": "Type",
    "definition": {
        "type": makeRefUnigraphId("$/composer/Object"),
        "parameters": {
            "indexedBy": makeRefUnigraphId("$/primitive/string"),
            "indexes": ["name"]
        },
        "properties": [
            {
                "key": "name",
                "definition": {
                    "type": makeRefUnigraphId("$/primitive/string")
                }
            }
        ]
    }
}

function createSimpleTodo (name: string) {
    return {
        "name": name,
        "done": false,
        "users": [{
            "name": "me"
        }]
    }
}

type ATodoList = {
    uid?: string,
    name: string,
    done: boolean,
    users: {
        name: string
    }[]
}

export default function TodoList () {
    
    const [initialized, setInitialized] = useState(false);
    const [subsId, setSubsId] = useState(0);
    const [todoList, setTodoList]: [ATodoList[], Function] = useState([]);
    const [newName, setNewName] = useState("");

    const init = async () => {
        await window.unigraph.ensureSchema("$/schema/todo", schemaTodo);
        await window.unigraph.ensureSchema("$/schema/user", schemaUser);
        setInitialized(true);
        window.unigraph.subscribeToType("$/schema/todo", (result: ATodoList[]) => {setTodoList(result)}).then((id: number) => {
            setSubsId(id);
        });
    }

    useEffect(() => {
        // Ensure todo schema is present
        init();

        return function cleanup() {
            window.unigraph.unsubscribe(subsId);
        };
    }, []);



    return <div>
        {!initialized ? <p>Loading...</p> : <div>
            Hello todo!    <br/>
            There are currently {todoList.length} todo items!   <br/>
            <List>
                {todoList.map(todo => {
                    let unpadded = window.unigraph.unpad(todo);
                    console.log(todo.uid, unpadded)
                    return <ListItem button key={unpadded.uid}>
                        <ListItemIcon>
                            <Checkbox checked={unpadded.done} onClick={_ => {
                                window.unigraph.updateSimpleObject(todo, "done", !unpadded.done);
                            }} />
                        </ListItemIcon>
                        <ListItemText primary={unpadded.name}/>
                        <ListItemSecondaryAction>
                            <IconButton aria-label="delete" onClick={() => window.unigraph.deleteObject(unpadded.uid!)}>
                                <Delete/>
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                })}
            </List>
            <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
            <Button onClick={() => window.unigraph.addObject(createSimpleTodo(newName), "$/schema/todo")}>Add</Button>
        </div>}
    </div>
}