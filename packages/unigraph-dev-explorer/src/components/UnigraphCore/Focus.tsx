import React from 'react';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';
import { TabContext } from '../../utils';
import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

export function Focus() {
    const [focus, setFocus] = React.useState<any[]>([]);
    const [focusEntity, setFocusEntity] = React.useState<any>({});
    const [listUid, setListUid] = React.useState('');
    const [subsId] = React.useState(getRandomInt);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        if (window.unigraph.getState('calendar/focusItems')) {
            window.unigraph.getState('calendar/focusItems').setValue({
                items: focus.map((el) => el._value.uid),
                listUid,
                contextUid: focusEntity.uid,
            });
        } else {
            window.unigraph.addState('calendar/focusItems', {
                items: focus.map((el) => el._value.uid),
                listUid,
                contextUid: focusEntity.uid,
            });
        }
    }, [focus, listUid, focusEntity]);

    useEffectOnce(() => {
        tabContext.subscribeToObject(
            '$/entity/focus',
            (entity: any) => {
                const children = entity?._value?.children?.['_value['];
                if (children) {
                    setListUid(entity?._value?.children?.uid);
                    children.sort(byElementIndex);
                    setFocus(children);
                } else {
                    setFocus([]);
                }
                setFocusEntity(entity);
            },
            subsId,
        );

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    });

    return (
        <DynamicObjectListView
            items={focus}
            context={focusEntity}
            listUid={listUid}
            itemGetter={(el: any) => el._value._value}
            itemRemover={(uids) => {
                window.unigraph.deleteItemFromArray(listUid, uids, focusEntity.uid, subsId);
            }}
        />
    );
}
