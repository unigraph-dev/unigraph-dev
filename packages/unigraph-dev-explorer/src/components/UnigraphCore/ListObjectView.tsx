import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

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
            itemRemover={(uids) => {
                window.unigraph.deleteItemFromArray(listValue.uid, uids, data.uid, callbacks?.subsId || undefined);
                if (window.unigraph.getNamespaceMap?.()['$/entity/inbox'].uid === data.uid) {
                    // Is removing from inbox, do things here...
                    window.unigraph
                        .getQueries(uids.map((el: string) => `(func: uid(${el})) { type { <unigraph.id> } }`))
                        .then((res: any[]) => {
                            const types = res
                                .map((el, index) => ({
                                    uid: uids[index],
                                    type: el[0]?.type?.['unigraph.id'],
                                }))
                                .filter((el) => el.type !== undefined);
                            // TODO: expand this into more general cases - e.g. over a hook
                            const emails = types.filter((el) => el.type === '$/schema/email_message');
                            if (emails.length) {
                                window.unigraph.runExecutable('$/executable/set-emails-as-read', {
                                    uids: emails.map((el) => el.uid),
                                });
                            }
                        });
                }
            }}
        />
    );
}
