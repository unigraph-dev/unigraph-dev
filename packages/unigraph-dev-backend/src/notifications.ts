import { buildUnigraphEntity, processAutoref } from 'unigraph-dev-common/lib/utils/entityUtils';
import { insertsToUpsert } from 'unigraph-dev-common/lib/utils/txnWrapper';
import { UnigraphNotification } from 'unigraph-dev-common/lib/types/unigraph';
import { Cache } from './caches';
import DgraphClient from './dgraphClient';

export function createNotificationsCache(client: DgraphClient): Cache<UnigraphNotification[]> {
    const cache: Cache<UnigraphNotification[]> = {
        data: [],
        updateNow: async () => [],
        cacheType: 'manual',
        subscribe: (listener) => null,
    };

    cache.updateNow = async () => {
        const nsMap = (await client.queryUnigraphId<any[]>('$/meta/namespace_map'))[0];
        if (!Object.keys(nsMap).includes('$/entity/notification_center')) {
            throw new ReferenceError(
                "Cannot find notification center in database. Are you sure you've loaded core packages already?",
            );
        }
        const ncObject = nsMap['$/entity/notification_center'];
        const items = Array.isArray(ncObject.children) ? nsMap.children : [];
        cache.data = items.reverse();
    };

    cache.updateNow();

    return cache;
}

export async function addNotification(item: UnigraphNotification, caches: any, client: DgraphClient) {
    const obj = buildUnigraphEntity(
        {
            ...item,
            content: {
                _value: item.content,
                type: { 'unigraph.id': '$/schema/note' },
            },
        },
        '$/schema/notification',
        caches.schemas.data,
    );
    const autoRefObj = processAutoref(obj, '$/schema/notification', caches.schemas.data);
    await client.createUnigraphUpsert(insertsToUpsert([autoRefObj], undefined, caches.schemas.dataAlt![0]));
    // TODO: make use of the notification center object
}
