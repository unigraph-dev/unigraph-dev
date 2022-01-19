import React from 'react';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { byElementIndex, unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { TabContext } from '../../utils';
import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

export function FavoriteBar() {
    const [fav, setFav] = React.useState<any[]>([]);
    const [favEntity, setFavEntity] = React.useState<any>({});
    const favState = window.unigraph.addState('favorites', []);
    const tabContext = React.useContext(TabContext);

    useEffectOnce(() => {
        const id = getRandomInt();

        tabContext.subscribeToObject(
            '$/entity/favorite_bar',
            (newFav: any) => {
                const children = newFav?._value?.children?.['_value['];
                if (children) {
                    children.sort(byElementIndex);
                    setFav(children);
                    favState.setValue(
                        children.map((el: any) => {
                            const unpadded = unpad(el);
                            return {
                                name: unpadded.name,
                                component: unpadded.view,
                                config: JSON.parse(unpadded.props).config,
                            };
                        }),
                    );
                }
                setFavEntity(newFav);
            },
            id,
        );

        return function cleanup() {
            tabContext.unsubscribe(id);
        };
    });

    return (
        <DynamicObjectListView
            items={fav}
            style={{ height: '' }}
            context={favEntity}
            listUid={favEntity?._value?.children?.uid}
            itemGetter={(el: any) => el._value._value}
            noBar
            noRemover
            defaultFilter={['no-deleted', 'no-noview']}
            itemRemover={(uids) => {
                window.unigraph.deleteItemFromArray(favEntity?._value?.children?.uid, uids, favEntity.uid);
            }}
        />
    );
}
