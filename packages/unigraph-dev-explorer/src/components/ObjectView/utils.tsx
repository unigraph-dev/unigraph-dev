import { useDrop } from 'react-dnd';
import { byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';

export const isStub = (object: any) =>
    object?._stub ||
    (typeof object === 'object' &&
        object.uid &&
        object.type &&
        typeof object.type['unigraph.id'] === 'string' &&
        typeof object.type['unigraph.id'].startsWith('$/') &&
        (Object.keys(object).length === 3 || Object.keys(object).filter((el) => el.startsWith('_value')).length === 0));

export function SubentityDropAcceptor({ uid }: any) {
    const [{ isOver, canDrop }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: { uid: string; itemType: string }, monitor) => {
            if (!monitor.didDrop() && item.uid !== uid) {
                window.unigraph.updateObject(uid, {
                    children: [
                        {
                            type: { 'unigraph.id': '$/schema/subentity' },
                            _value: {
                                // "type": {"unigraph.id": item.itemType},
                                uid: item.uid,
                            },
                        },
                    ],
                });
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    return (
        <div
            ref={dropSub}
            style={{
                opacity: canDrop && isOver ? 1 : 0,
                width: '100%',
                height: '6px',
                marginTop: '-3px',
            }}
        >
            <div
                style={{
                    height: '100%',
                    backgroundColor: 'gray',
                    margin: '0px',
                    marginLeft: '48px',
                    borderRadius: '4px',
                }}
            />
        </div>
    );
}

export const getSubentities = (data: any) =>
    data?._value?.children?.['_value[']
        ?.sort(byElementIndex)
        ?.map?.((el: any) => el._value)
        .filter((el: any) => el?.type?.['unigraph.id'] === '$/schema/subentity');
