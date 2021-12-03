import { TextField, Button, List, ListItem, Divider } from "@material-ui/core";
import React from "react";
import { withUnigraphSubscription } from "../../unigraph-react"
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";
import { DynamicObjectListView } from "../../components/ObjectView/DynamicObjectListView";

export const NotesListBody = ({data}: any) => {
    return <DynamicObjectListView context={null} items={data} subscribeOptions={{queryAsType: "$/schema/note_block", depth: 9}}/>
}

export const NotesListAll = withUnigraphSubscription(NotesListBody, { schemas: [], defaultData: [], packages: []},
{ afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
    window.unigraph.subscribeToType("$/schema/note_block", (result: any[]) => {setData(result.reverse())}, subsId, {metadataOnly: true});
}})

export const NotesList = () => {
    const [newName, setNewName] = React.useState("");

    return <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
        <NotesListAll />
    </div>
}