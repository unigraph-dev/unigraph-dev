import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView"

export const ListObjectQuery = (uid: string) => `(func: uid(${uid})) @recurse { uid <unigraph.id> expand(_userpredicate_) }`

export const ListObjectView = ({data, callbacks}: any) => {
    const listValue = data?.['_value']?.children

    return <DynamicObjectListView
        items={listValue['_value['] || []} context={data} listUid={listValue.uid} callbacks={{...callbacks}}
        itemGetter={(el: any) => el['_value']['_value']}
        itemRemover={(uids) => {window.unigraph.deleteItemFromArray(listValue.uid, uids, data['uid'], callbacks?.subsId || undefined)}}
    />
}