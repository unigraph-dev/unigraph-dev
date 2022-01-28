/* eslint-disable no-await-in-loop */
/**
 * This manager file defines relevant logic and criterions to ensure data model, package and schema consistency.
 *
 * The corresponding docs pages are namespaces.md, schemas_and_objects.md, data_model.md, apps.md.
 */

import { insertsToUpsert } from 'unigraph-dev-common/lib/utils/txnWrapper';
import { ComposerUnionInstance } from 'unigraph-dev-common/lib/types/json-ts';
import { buildGraphFromMap, processAutorefUnigraphId } from 'unigraph-dev-common/lib/utils/entityUtils';
import { Cache } from './caches';
import { defaultPackages, defaultTypes, defaultUserlandSchemas } from './templates/defaultDb';
import DgraphClient from './dgraphClient';
import { addUnigraphPackage } from './packageManager';

export async function checkOrCreateDefaultDataModel(client: DgraphClient) {
    const unigraphObject: unknown[] = await client.queryUnigraphId<unknown[]>('$/unigraph');

    if (unigraphObject.length < 1) {
        // Insert default data
        await client.setSchema(defaultTypes);
        await client.createUnigraphUpsert(
            insertsToUpsert([
                processAutorefUnigraphId({
                    'unigraph.id': '$/meta/namespace_map',
                    '$/schema/executable': {
                        'unigraph.id': '$/schema/executable',
                    },
                    '$/schema/package_manifest': {
                        'unigraph.id': '$/schema/package_manifest',
                    },
                }),
            ]),
        );

        const tempSchemaCache = createSchemaCache(client);

        for (let i = 0; i < defaultUserlandSchemas.length; i += 1) {
            const schema = processAutorefUnigraphId(defaultUserlandSchemas[i]);
            await client.createUnigraphUpsert(insertsToUpsert([schema], undefined, tempSchemaCache.dataAlt![0]));
        }

        await tempSchemaCache.updateNow();

        for (let i = 0; i < defaultPackages.length; i += 1) {
            await addUnigraphPackage(client, defaultPackages[i], {
                schemas: tempSchemaCache,
            });
            await tempSchemaCache.updateNow();
        }
    } else {
        // Everything is OK, returning
    }
}

export function createSchemaCache(client: DgraphClient): Cache<any> {
    const cache: Cache<any> = {
        data: {},
        dataAlt: [{}],
        updateNow: async () => null,
        cacheType: 'manual',
        subscribe: (listener) => null,
    };

    cache.updateNow = async () => {
        const newdata = await client.getSchemasFromTable();
        // cache.data = buildGraphFromMap(cache.data);
        cache.data = newdata || [];
        // Remove all non-schema objects items first
        Object.entries(cache.data).forEach(([k, v]: any) => {
            if (k.startsWith('$/schema/interface/')) {
                const defn = v._definition as ComposerUnionInstance;
                // console.log(k, v, defn);
                defn._parameters._definitions = [];
            }
            if (!k.startsWith('$/schema')) {
                cache.data[k] = undefined;
            }
        });
        const newdata2 = await client.getSchemas();
        newdata2.forEach((obj: any) => {
            if (
                obj &&
                typeof obj['unigraph.id'] === 'string' &&
                obj['unigraph.id'].split('/').reverse()[1] === 'interface'
            ) {
                // This is an interface object
                const defn = obj._definition as ComposerUnionInstance;
                const revPath = obj['unigraph.id'].split('/').reverse();
                if (
                    cache.data[`$/schema/interface/${revPath[0]}`]?._definition?._parameters?._definitions?.length >=
                        0 &&
                    defn?._parameters?._definitions?.length >= 0
                ) {
                    (
                        cache.data[`$/schema/interface/${revPath[0]}`]._definition as ComposerUnionInstance
                    )._parameters._definitions?.push(...defn._parameters._definitions);
                }
            }
            if (obj && typeof obj['unigraph.id'] === 'string' && obj['unigraph.id'].includes('/schema/')) {
                cache.dataAlt![0][obj['unigraph.id']] = obj;
                if (!cache.data[obj['unigraph.id']]) {
                    cache.data[obj['unigraph.id']] = obj;
                }
            }
        });
        cache.data = buildGraphFromMap(cache.data);
    };

    cache.updateNow();

    return cache;
}
