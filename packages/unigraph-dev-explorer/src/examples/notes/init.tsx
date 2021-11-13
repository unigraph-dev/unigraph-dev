import { MenuItem } from "@material-ui/core";
import { registerDynamicViews, registerDetailedDynamicViews, registerContextMenuItems } from "unigraph-dev-common/lib/api/unigraph-react";
import { NoteBlock, DetailedNoteBlock } from "./NoteBlock";

export const noteQuery = (uid: string) => `(func: uid(${uid})) {
    uid
    _hide
    type {
        <unigraph.id>
    }
    _value {
        uid
        text {
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
            <_value[> {
                <_index> { uid <_value.#i> }
                <_key>
                <_value> {
                    _hide
                    _value {
                        _hide
                        uid
                        type { <unigraph.id> }
                    }
                    uid
                    type { <unigraph.id> }
                }
            }
        }
    }
}` 

export const init = () => {
    registerDynamicViews({ "$/schema/note_block": NoteBlock })
    registerDetailedDynamicViews({ "$/schema/note_block": { view: DetailedNoteBlock, query: noteQuery } })

    registerContextMenuItems("$/schema/note_block", [(uid: any, object: any, handleClose: any, callbacks: any) => <MenuItem onClick={() => {
        handleClose(); callbacks['convert-child-to-todo']();
    }}>
        Convert note as TODO
    </MenuItem>])
}