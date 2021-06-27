import { Typography } from "@material-ui/core";
import React, { FormEvent } from "react";
import { registerDetailedDynamicViews, registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { byElementIndex, unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";

import _ from "lodash";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { Actions } from "flexlayout-react";
import { addChild, indentChild, setFocus, splitChild, unindentChild, unsplitChild } from "./commands";

export const getSubentities = (data: any) => {
    let subentities: any, otherChildren: any;
    if (!(data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['])) {
        [subentities, otherChildren] = [[], []];
    } else {
        [subentities, otherChildren] = data?.['_value']?.['semantic_properties']?.['_value']?.['_value']?.['children']?.['_value['].sort(byElementIndex).reduce((prev: any, el: any) => {
            if ('$/schema/subentity' !== el?.['_value']?.['_value']?.type?.['unigraph.id']) return [prev[0], [...prev[1], el['_value']?.['_value']]];
            else return [[...prev[0], el['_value']?.['_value']['_value']], prev[1]]
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
    "add-child": addChild,
    "set-focus": setFocus,
    "unsplit-child": unsplitChild,
    "split-child": splitChild,
    
    "indent-child": indentChild,
    "unindent-child": unindentChild
}

export const PlaceholderNoteBlock = ({ callbacks }: any) => {
    return <div style={{width: "100%"}}>
        <Typography variant="body1" style={{fontStyle: "italic"}}
            onClick={() => {callbacks['add-child']();}}
        >Click here to start writing</Typography>
    </div>
}

export const DetailedNoteBlock = ({data, isChildren, callbacks, options}: any) => {
    const [subentities, otherChildren] = getSubentities(data);
    const [command, setCommand] = React.useState<() => any | undefined>();
    const inputter = (text: string) => {
        return window.unigraph.updateObject(data.uid, {
            text: {type: {'unigraph.id': "$/schema/markdown"}, _value: text}
        })
    }
    const dataref = React.useRef<any>();
    const childrenref = React.useRef<any>();
    const inputDebounced = React.useRef(_.throttle(inputter, 1000)).current
    const setCurrentText = (text: string) => {textInput.current.textContent = text};
    const [edited, setEdited] = React.useState(false);
    const textInput: any = React.useRef();
    const editorContext = {
        setEdited, setCommand, childrenref
    }

    React.useEffect(() => {
        dataref.current = data;
        const dataText = data.get('text').as('primitive')
        if (dataText && options?.viewId) window.layoutModel.doAction(Actions.renameTab(options.viewId, `Note: ${dataText}`))
        if (textInput.current.textContent !== dataText && !edited) {setCurrentText(dataText); textInput.current.textContent = dataText;}
        else if (textInput.current.textContent === dataText && edited) setEdited(false);
    }, [data])

    React.useEffect(() => {
        if (!edited && command) {
            command();
            setCommand(undefined);
        }
    }, [command, edited])

    return <div style={{width: "100%"}}>
        <Typography 
            variant={isChildren ? "body1" : "h4"} 
            contentEditable={true} 
            ref={textInput}
            onInput={(ev) => {onNoteInput(inputDebounced, ev); if (ev.currentTarget.textContent !== data.get('text').as('primitive') && !edited) setEdited(true)}}
            onKeyDown={async (ev) => {
                const caret = document.getSelection()?.anchorOffset;
                switch (ev.code) {
                    case 'Enter':
                        ev.preventDefault();
                        inputDebounced.flush();
                        setCommand(() => callbacks['split-child']?.bind(this, caret))
                        break;
                    
                    case 'Tab':
                        ev.preventDefault();
                        inputDebounced.flush();
                        if (ev.shiftKey) {
                            setCommand(() => callbacks['unindent-child-in-parent']?.bind(this))
                        } else {
                            setCommand(() => callbacks['indent-child']?.bind(this));
                        }
                        break;

                    case 'Backspace':
                        if (caret === 0 && document.getSelection()?.type === "Caret") {
                            ev.preventDefault();
                            inputDebounced.flush();
                            setCommand(() => callbacks['unsplit-child'].bind(this));
                        }
                        break;
                
                    default:
                        console.log(ev);
                        break;
                }
            }}
        >
        </Typography>
        {buildGraph(otherChildren).map((el: any) => <AutoDynamicView object={el}/>)}
        <ul ref={childrenref} style={{listStyle: "disc"}}>
            {(subentities.length || isChildren) ? buildGraph(subentities).map((el: any, elindex) => <li key={el.uid}>
                <AutoDynamicView 
                    object={el} 
                    callbacks={{
                        ...Object.fromEntries(Object.entries(noteBlockCommands).map(([k, v]: any) => [k, (...args: any[]) => v(dataref.current, editorContext, elindex, ...args)])), 
                        "unindent-child-in-parent": () => {callbacks['unindent-child'](elindex)}
                    }} 
                    component={{"$/schema/note_block": DetailedNoteBlock}} attributes={{isChildren: true}}
                />
            </li>) : <li><PlaceholderNoteBlock callbacks={{"add-child": () => noteBlockCommands['add-child'](dataref.current, editorContext)}}/></li>}
        </ul>
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/note_block": NoteBlock})
    registerDetailedDynamicViews({"$/schema/note_block": DetailedNoteBlock})
}