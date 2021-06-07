import { withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";

export const NotesListBody = ({data}: any) => {
    return <div>
        {data.map((el: any) => <AutoDynamicView object={el}/>)}
    </div>
}

export const NotesListAll = withUnigraphSubscription(NotesListBody, { schemas: [], defaultData: Array(10).fill({'type': {'unigraph.id': '$/skeleton/default'}}), packages: []},
{ afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
    window.unigraph.subscribeToType("$/schema/note_block", (result: any[]) => {setData(result.reverse())}, subsId);
}})

export const NotesList = () => {
    return <div>
        <NotesListAll />
    </div>
}