import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';
import { inboxRemoveCallback } from '../UnigraphInbox/Inbox';

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
}`;
export function ListObjectView({ data, callbacks, ...attributes }: any) {
    const listValue = data?._value?.children;

    return (
        <DynamicObjectListView
            {...attributes}
            items={listValue['_value['] || []}
            context={data}
            listUid={listValue.uid}
            callbacks={{ ...(attributes?.callbacks || {}), ...callbacks }}
            itemGetter={(el: any) => el._value._value}
            itemRemover={(uids: string[]) => {
                window.unigraph.deleteItemFromArray(listValue.uid, uids, data.uid, callbacks?.subsId || undefined);
                if (window.unigraph.getNamespaceMap?.()['$/entity/inbox'].uid === data.uid) {
                    // Is removing from inbox, do things here...
                    inboxRemoveCallback(uids);
                }
            }}
        />
    );
}
