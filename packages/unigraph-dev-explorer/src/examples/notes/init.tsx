import { MenuItem } from "@material-ui/core";
import { registerDynamicViews, registerDetailedDynamicViews, registerContextMenuItems, registerQuickAdder } from "../../unigraph-react";
import { NoteBlock, DetailedNoteBlock } from "./NoteBlock";

const getQuery: ((depth: number) => string) = (depth: number) => {
    if (depth >= 8) return `{ uid _hide type {<unigraph.id>} }`;
    else return `{
        uid
        _hide
        type {
            <unigraph.id>
        }
        _value {
            uid
            text {
                uid
                _value {
                    _value {
                        <dgraph.type>
                        uid type { <unigraph.id> }
                        <_value.%>
                    }
                    uid type { <unigraph.id> }
                }
            }
            children {
                uid
                <_value[> {
                    uid
                    <_index> { uid <_value.#i> }
                    <_key>
                    <_value> {
                        _hide
                        _value ${getQuery(depth+1)}
                        uid
                        type { <unigraph.id> }
                    }
                }
            }
        }
    }`
}

export const noteQuery = (uid: string, depth = 0) => `(func: uid(${uid})) ${getQuery(depth + 1)}` 

export const init = () => {
    registerDynamicViews({ "$/schema/note_block": NoteBlock })
    registerDetailedDynamicViews({ "$/schema/note_block": { view: DetailedNoteBlock, query: noteQuery } })

    const quickAdder = async (inputStr: string, preview = true) => {
        if (!preview) {
            const uids = await window.unigraph.addObject({text: {_value: inputStr, type: {'unigraph.id': "$/schema/markdown"}}}, "$/schema/note_block");
            window.wsnavigator(`/library/object?uid=${uids[0]}&isStub=true&type=$/schema/note_block`)
        }
        else return [{text: {_value: inputStr, type: {'unigraph.id': "$/schema/markdown"}}}, "$/schema/note_block"];
    }

    registerQuickAdder({'n': quickAdder, 'note': quickAdder})

    registerContextMenuItems("$/schema/note_block", [(uid: any, object: any, handleClose: any, callbacks: any) => <MenuItem onClick={() => {
        handleClose(); callbacks['convert-child-to-todo']();
    }}>
        Convert note as TODO
    </MenuItem>])
}