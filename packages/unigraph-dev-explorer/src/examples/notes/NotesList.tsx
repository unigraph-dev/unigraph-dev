import React from 'react';
import { byUpdatedAt } from 'unigraph-dev-common/lib/utils/entityUtils';
import { withUnigraphSubscription } from '../../unigraph-react';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { noteQuery } from './noteQuery';

export function NotesListBody({ data }: any) {
    return (
        <DynamicObjectListView
            context={null}
            items={data}
            subscribeOptions={{
                queryAsType: '$/schema/note_block',
                depth: 9,
                queryFn: noteQuery,
            }}
        />
    );
}

export const NotesListAll = withUnigraphSubscription(
    NotesListBody,
    { schemas: [], defaultData: [], packages: [] },
    {
        afterSchemasLoaded: (subsId: number, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType(
                '$/schema/note_block',
                (result: any[]) => {
                    setData(result.sort(byUpdatedAt).reverse());
                },
                subsId,
                { metadataOnly: true },
            );
        },
    },
);

export function NotesList() {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <NotesListAll />
        </div>
    );
}
