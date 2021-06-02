import { Typography } from "@material-ui/core";
import React, { FormEvent, useMemo } from "react";
import { registerDetailedDynamicViews, registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";

import _ from "lodash";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { useEffectOnce } from "react-use";
import { AnyMxRecord } from "dns";

export const getSubentities = (data: any) => {
    let subentities: any, otherChildren: any;
    if (!(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['])) {
        [subentities, otherChildren] = [[], []];
    } else {
        [subentities, otherChildren] = data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['].sort(byElementIndex).reduce((prev: any, el: any) => {
            if ('$/schema/subentity' !== el?.['_value']?.type?.['unigraph.id']) return [prev[0], [...prev[1], el['_value']]];
            else return [[...prev[0], el['_value']['_value']], prev[1]]
        }, [[], []])
    }
    return [subentities, otherChildren];
}

const getSemanticChildren = (data: any) => data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']

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
    "create-child": (data: any, index: number) => {
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
    },
    /**
     * Indents a child node into their last sibling (or a specified element).
     * 
     * The index is relative to all subentities (outliner children).
     * 
     * TODO: This code is very poorly written. We need to change it after we have unigraph object prototypes.
     */
    "indent-child": (data: any, index: number, parent?: number) => {
        if (!parent && index !== 0) {
            parent = index - 1;
        } else if (!parent) {
            return;
        }
        let currSubentity = -1;
        let isDeleted = false;
        let parIndex: number | undefined = undefined;
        let newUid = {uid: undefined}
        const children = getSemanticChildren(data)?.['_value['].sort(byElementIndex);
        const newChildren = children?.map((el: any, elindex: any) => {
            if (el?.['_value']?.['type']?.['unigraph.id'] === "$/schema/subentity") {
                currSubentity ++;
                if (currSubentity === index) {
                    isDeleted = true;
                    newUid.uid = el['_value'].uid;
                    return undefined;
                } else if (currSubentity === parent) {
                    parIndex = elindex;
                    return el;
                } else {
                    if (isDeleted) return {uid: el.uid, '_index': {'_value.#i': el['_index']['_value.#i'] - 1}}
                    else return {uid: el.uid}
                }
            } else return {uid: el.uid};
        })
        if (parIndex !== undefined) newChildren[parIndex] = _.mergeWith({}, newChildren[parIndex], {'_value': { '_value': { '_value': {
            'semantic_properties': {
                '_propertyType': 'inheritance',
                '_value': { 'dgraph.type': 'Entity', type: {'unigraph.id': '$/schema/semantic_properties'}, '_propertyType': 'inheritance', '_value': {
                    children: {'_value[': [{
                        '_index': {'_value.#i': getSemanticChildren(newChildren[parIndex]['_value']['_value'])?.['_value[']?.length || 0}, // always append at bottom
                        '_value': newUid
                    }]}
                }
            }}}}
        }}, function (objValue: any, srcValue: any) {
            if (_.isArray(objValue)) {
              return objValue.concat(srcValue);
            }
          })
        const finalChildren = newChildren.filter((el: any) => el !== undefined);
        console.log(finalChildren)
        window.unigraph.updateObject(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.uid, {'children': {'_value[': finalChildren}}, false, false);
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
                switch (ev.code) {
                    case 'Enter':
                        ev.preventDefault();
                        callbacks['create-child']?.();
                        break;
                    
                    case 'Tab':
                        ev.preventDefault();
                        callbacks['indent-child']?.();
                        break;
                
                    default:
                        break;
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