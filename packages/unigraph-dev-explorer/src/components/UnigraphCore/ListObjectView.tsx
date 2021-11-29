import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView"

/** Dependent on the specific definition of object!! */
export const ListObjectQuery = (uid: string) => `(func: uid(${uid})) {
    _value {
        name { <_value.%> }
        children { uid <_value[> {
            _index {
                <_value.#i>
            }
            _value { 
                uid
                type { <unigraph.id> }
                _value {
                    uid
                    type { <unigraph.id> }
                }
            }
        } }
    }
    uid
    type { <unigraph.id> }
}`

export const ListObjectView = ({data, callbacks}: any) => {
    const listValue = data?.['_value']?.children

    return <DynamicObjectListView
        items={listValue['_value['] || []} context={data} listUid={listValue.uid} callbacks={{...callbacks}}
        itemGetter={(el: any) => el['_value']['_value']}
        itemRemover={(uids) => {window.unigraph.deleteItemFromArray(listValue.uid, uids, data['uid'], callbacks?.subsId || undefined)}}
    />
}