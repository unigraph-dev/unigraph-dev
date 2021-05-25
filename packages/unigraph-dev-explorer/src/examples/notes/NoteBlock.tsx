import { Typography } from "@material-ui/core";
import React, { useMemo } from "react";
import { registerDetailedDynamicViews, registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";

import { createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";

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

const dataToView: (data: any) => any = (data) => {
    if (data?.type?.['unigraph.id'] === "$/schema/note_block") {
        const [subentities, otherChildren] = getSubentities(data);
        return {type: "outliner", children: [{text: data?.['_value']?.['text']?.["_value.%"] || ""}, ...buildGraph(subentities).map(dataToView)], semantic_children: otherChildren.map(dataToView), data: data}
    } else {
        return {type: "autodynamicview", data: data, children: [{text: ""}]}
    }
}

const renderer = ({attributes, children, element}: any) => {
    switch (element.type) {
        case 'outliner':
            attributes = {...attributes, style: {...attributes.style, flexDirection: "column"}}
            return <AutoDynamicView object={element.data} component={{"$/schema/note_block": () => <React.Fragment>
                <Typography variant="body1">{children[0]}</Typography>
                <ul>{children.slice(1).map((el: any) => <li>{el}</li>)}</ul>
            </React.Fragment>}} attributes={attributes}/>
        default:
            return <AutoDynamicView object={JSON.parse(JSON.stringify(element.data))} attributes={attributes} /> 
    }
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

export const DetailedNoteBlock = ({data}: any) => {
    const [viewData, setViewData] = React.useState([dataToView(data)]);
    const editor = useMemo(() => withReact(createEditor() as any), [])
    

    return <div>
        <Slate editor={editor} value={viewData} onChange={(change) => {console.log(change);}}>
            <Editable renderElement={renderer} />
        </Slate>
    </div>
}

export const init = () => {
    registerDynamicViews({"$/schema/note_block": NoteBlock})
    registerDetailedDynamicViews({"$/schema/note_block": DetailedNoteBlock})
}