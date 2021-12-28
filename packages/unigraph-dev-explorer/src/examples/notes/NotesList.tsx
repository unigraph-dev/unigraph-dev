import {
    TextField, Button, List, ListItem, Divider,
} from '@material-ui/core';
import React from 'react';
import { byUpdatedAt } from 'unigraph-dev-common/lib/utils/entityUtils';
import { withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { noteQuery } from './init';

export function NotesListBody({ data }: any) {
    return <DynamicObjectListView context={null} items={data} subscribeOptions={{ queryAsType: '$/schema/note_block', depth: 9, queryFn: noteQuery }} />;
}

export const NotesListAll = withUnigraphSubscription(
    NotesListBody,
    { schemas: [], defaultData: [], packages: [] },
    {
        afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
            window.unigraph.subscribeToType('$/schema/note_block', (result: any[]) => { setData(result.sort(byUpdatedAt).reverse()); }, subsId, { metadataOnly: true });
        },
    },
);

export function NotesList() {
    const [newName, setNewName] = React.useState('');

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <NotesListAll />
        </div>
    );
}
