import { TextField, Button, List, ListItem, Divider } from "@material-ui/core";
import React from "react";
import { withUnigraphSubscription } from "../../unigraph-react"
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";

export const NotesListBody = ({data}: any) => {
    return <div>
        <List>
            {data.map((el: any) => <React.Fragment>
                <Divider/>
                <ListItem key={el.uid}><AutoDynamicView object={el}/></ListItem>
            </React.Fragment>)}
        </List>
    </div>
}

export const NotesListAll = withUnigraphSubscription(NotesListBody, { schemas: [], defaultData: [], packages: []},
{ afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
    window.unigraph.subscribeToType("$/schema/note_block", (result: any[]) => {setData(result.reverse())}, subsId, {depth: 9});
}})

export const NotesList = () => {
    const [newName, setNewName] = React.useState("");

    return <div>
        <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
        <Button onClick={() => window.unigraph.addObject({text: {_value: newName, type: {'unigraph.id': "$/schema/markdown"}}}, "$/schema/note_block")}>Add</Button>
        <NotesListAll />
    </div>
}