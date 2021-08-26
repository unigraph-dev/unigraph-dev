import { DynamicObjectListView } from "../ObjectView/DynamicObjectListView"

export const ListObjectView = ({data}: any) => {
    const listValue = data?.['_value']?.children

    return <DynamicObjectListView
        items={listValue['_value['] || []} context={data} listUid={listValue.uid} callbacks={{}}
        itemGetter={(el: any) => el['_value']['_value']}
        itemRemover={(uids) => {window.unigraph.deleteItemFromArray(listValue.uid, uids, data['uid'])}}
    />
}