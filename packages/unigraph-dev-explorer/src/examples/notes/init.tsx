import { MenuItem, Typography } from '@material-ui/core';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicViewDetailed } from '../../components/ObjectView/AutoDynamicViewDetailed';
import { inlineRefsToChildren } from '../../components/UnigraphCore/InlineSearchPopup';
import {
    registerDynamicViews,
    registerDetailedDynamicViews,
    registerContextMenuItems,
    registerQuickAdder,
} from '../../unigraph-react';
import { NoteBlock, DetailedNoteBlock } from './NoteBlock';
import { noteQuery, noteQueryDetailed, journalQuery, journalQueryDetailed } from './noteQuery';

export const init = () => {
    registerDynamicViews({
        '$/schema/note_block': { view: NoteBlock, query: noteQuery, noSubentities: true },
    });
    registerDetailedDynamicViews({
        '$/schema/note_block': {
            view: DetailedNoteBlock,
            query: noteQueryDetailed,
        },
    });
    registerDynamicViews({
        '$/schema/journal': {
            view: (props: any) => NoteBlock({ ...props, data: new UnigraphObject(props.data._value.note._value) }),
            query: journalQuery,
        },
    });
    registerDetailedDynamicViews({
        '$/schema/journal': {
            view: (props: any) => (
                <AutoDynamicViewDetailed
                    {...props}
                    object={new UnigraphObject(props.data._value.note._value)}
                    callbacks={{ ...props.callbacks, isEmbed: true }}
                />
            ),
            query: journalQueryDetailed,
        },
    });

    const quickAdder = async (
        inputStr: string,
        // eslint-disable-next-line default-param-last
        preview = true,
        callback: any,
        refs?: any,
    ) => {
        if (!preview) {
            const uids = await window.unigraph.addObject(
                {
                    text: {
                        _value: inputStr,
                        type: { 'unigraph.id': '$/schema/markdown' },
                    },
                    children: inlineRefsToChildren(refs),
                },
                '$/schema/note_block',
            );
            if (!callback) window.wsnavigator(`/library/object?uid=${uids[0]}&isStub=true&type=$/schema/note_block`);
            return uids;
        }
        return [
            {
                text: {
                    _value: inputStr,
                    type: { 'unigraph.id': '$/schema/markdown' },
                },
            },
            '$/schema/note_block',
        ];
    };

    const tt = () => (
        <div>
            <Typography>Enter the note&apos;s title, then press Enter to go</Typography>
        </div>
    );

    const description = 'Add a note';
    registerQuickAdder({
        note: {
            adder: quickAdder,
            tooltip: tt,
            description,
            alias: ['n'],
        },
    });

    registerContextMenuItems('$/schema/note_block', [
        (uid: any, object: any, handleClose: any, callbacks: any) => (
            <MenuItem
                onClick={() => {
                    handleClose();
                    callbacks['convert-child-to-todo']();
                }}
            >
                Convert note as TODO
            </MenuItem>
        ),
    ]);
};
