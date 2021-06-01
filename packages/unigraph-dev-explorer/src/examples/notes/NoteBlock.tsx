import { Typography } from "@material-ui/core";
import React, { FormEvent, useMemo } from "react";
import { registerDetailedDynamicViews, registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";

import _ from "lodash";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { useEffectOnce } from "react-use";

export const getSubentities = (data: any) => {
    let subentities: any, otherChildren: any;
    if (!(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['])) {
        [subentities, otherChildren] = [[], []];
    } else {
        [subentities, otherChildren] = data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['].reduce((prev: any, el: any) => {
            if ('$/schema/subentity' !== el?.['_value']?.type?.['unigraph.id']) return [prev[0], [...prev[1], el['_value']]];
            else return [[...prev[0], el['_value']['_value']], prev[1]]
        }, [[], []])
    }
    return [subentities, otherChildren];
}

export const NoteBody = ({text, children}: any) => {
    return <div>
        <Typography variant="body1">{text}</Typography>
        {children.map((el: any) => <AutoDynamicView object={el} />)}
    </div>
}

export const NoteBlock = ({data} : any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const unpadded = unpad(data);

    return <div onClick={() => {window.wsnavigator(`/library/object?uid=${data.uid}`)}}>
        <NoteBody text={unpadded.text} children={otherChildren} />
        <Typography variant="body2" color="textSecondary">{subentities.length ? " and " + subentities.length + " children" : " no children"}</Typography>
    </div>
}

const onNoteInput = (inputDebounced: any, event: FormEvent<HTMLSpanElement>) => {
    const newInput = event.currentTarget.textContent;

    inputDebounced(newInput);
}

const noteBlockCommands = {
    "create-sibling": (data: any, index: number) => {
        window.unigraph.updateObject(data.uid, {
            semantic_properties: {
                children: [{
                    type: {"unigraph.id": "$/schema/subentity"},
                    _value: {
                        type: {"unigraph.id": "$/schema/note_block"},
                        text: ""
                    }
                }]
            }
        })
    }
}

export const DetailedNoteBlock = ({data, isChildren, callbacks}: any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const inputDebounced = React.useRef(_.throttle((text: string) => {
        window.unigraph.updateObject(data.uid, {
            text: text
        })
    }, 2000)).current
    const [currentText, setCurrentText] = React.useState(data?.['_value']['text']['_value.%']);
    const [edited, setEdited] = React.useState(false);

    React.useEffect(() => {
        if (currentText !== data?.['_value']['text']['_value.%'] && !edited) setCurrentText(data?.['_value']['text']['_value.%'])
        else if (currentText === data?.['_value']['text']['_value.%'] && !edited) setEdited(false);
    }, [data])

    return <div style={{width: "100%"}}>
        <Typography 
            variant={isChildren ? "body1" : "h4"} 
            contentEditable={true} 
            onInput={(ev) => {onNoteInput(inputDebounced, ev); setEdited(true)}}
            onKeyDown={(ev) => {
                if (ev.code === "Enter") {
                    ev.preventDefault();
                    callbacks['create-sibling']?.();
                } 
            }}
        >
            {currentText}
        </Typography>
        {buildGraph(otherChildren).map((el: any) => <AutoDynamicView object={el}/>)}
        <ul>
            {buildGraph(subentities).map((el: any, elindex) => <li><AutoDynamicView object={el} callbacks={Object.fromEntries(Object.entries(noteBlockCommands).map(([k, v]: any) => [k, (() => v(data, elindex))]))} component={{"$/schema/note_block": DetailedNoteBlock}} attributes={{isChildren: true}}/></li>)}
        </ul>
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/note_block": NoteBlock})
    registerDetailedDynamicViews({"$/schema/note_block": DetailedNoteBlock})
}