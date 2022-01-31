import React from 'react';
import { Fab } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';
import { byUpdatedAt } from 'unigraph-dev-common/lib/utils/entityUtils';
import { withUnigraphSubscription } from '../../unigraph-react';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { noteQuery } from './noteQuery';

export function NotesListBody({ data }: any) {
    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <DynamicObjectListView
                context={null}
                items={data}
                subscribeOptions={{
                    queryAsType: '$/schema/note_block',
                    depth: 9,
                    queryFn: noteQuery,
                }}
            />
            <Fab
                aria-label="add"
                style={{ position: 'absolute', right: '16px', bottom: '16px' }}
                onClick={() => {
                    window.unigraph.getState('global/omnibarSummoner').setValue({
                        show: true,
                        tooltip: 'Add a note',
                        defaultValue: '+note ',
                    });
                }}
            >
                <AddIcon />
            </Fab>
        </div>
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
