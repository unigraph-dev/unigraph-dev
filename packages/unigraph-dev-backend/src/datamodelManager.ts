/* eslint-disable no-await-in-loop */
/**
 * This manager file defines relevant logic and criterions to ensure data model, package and schema consistency.
 *
 * The corresponding docs pages are namespaces.md, schemas_and_objects.md, data_model.md, apps.md.
 */

import { insertsToUpsert } from 'unigraph-dev-common/lib/utils/txnWrapper';
import { PackageDeclaration } from 'unigraph-dev-common/lib/types/packages';
import { ComposerUnionInstance } from 'unigraph-dev-common/lib/types/json-ts';
import {
    buildGraphFromMap,
    buildUnigraphEntity,
    processAutoref,
    processAutorefUnigraphId,
    unpad,
} from 'unigraph-dev-common/lib/utils/entityUtils';
import { getRefQueryUnigraphId } from 'unigraph-dev-common/lib/utils/utils';
import { Cache } from './caches';
import { defaultPackages, defaultTypes, defaultUserlandSchemas, packageManifestSchema } from './templates/defaultDb';
import DgraphClient from './dgraphClient';

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

export function createPackageCache(client: DgraphClient): Cache<any> {
    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: 'manual',
        subscribe: (listener) => null,
    };

    cache.updateNow = async () => {
        const newdata = await client.getPackages();
        cache.data = newdata.reduce((prev, obj) => {
            obj.pkgManifest = unpad(obj.pkgManifest);
            if (obj && obj.pkgManifest && obj.pkgManifest.package_name) {
                prev[obj.pkgManifest.package_name] = obj;
            }
            return prev;
        }, {});
    };

    cache.updateNow();

    return cache;
}

/**
 * Adds a unigraph package into the current database.
 * @param client
 * @param pkg
 * @param caches
 * @param update Whether it is an update. If true, we will not create duplicate package entities.
 */
export async function addUnigraphPackage(
    client: DgraphClient,
    pkg: PackageDeclaration,
    caches: Record<string, Cache<any>>,
    update = false,
) {
    // 1. Create all schemas associated with the package in the correct namespace
    const interfaces: any[] = []; // additional interfaces for every schema
    const schemas = Object.entries(pkg.pkgSchemas).map(([key, schema]) => {
        const currentUnigraphId = `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/schema/${key}`;
        // eslint-disable-next-line max-len
        const currentUnigraphInterfaceId = `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/schema/interface/${key}`;
        if (!key.startsWith('interface/')) {
            // add interface definition as well
            interfaces.push({
                'unigraph.id': currentUnigraphInterfaceId,
                'dgraph.type': 'Type',
                _name: `Interface: ${schema._name}`,
                _definition: {
                    type: { 'unigraph.id': '$/composer/Union' },
                    _parameters: {
                        _definitions: [
                            {
                                type: { 'unigraph.id': `$/schema/${key}` },
                            },
                        ],
                    },
                },
            });
        }
        return {
            'unigraph.id': currentUnigraphId,
            ...schema,
        };
    });
    const fullSchemas = [...schemas, ...interfaces];
    const toUpsert = [];
    for (let i = 0; i < fullSchemas.length; i += 1) {
        const schemaShorthandRef = {
            ...getRefQueryUnigraphId(`$/${fullSchemas[i]['unigraph.id'].split('/').slice(4).join('/')}`),
            'dgraph.type': ['Type'],
            '_value[': getRefQueryUnigraphId(fullSchemas[i]['unigraph.id']),
        };
        const schemaAutoref = processAutorefUnigraphId(fullSchemas[i]);
        toUpsert.push(schemaAutoref, schemaShorthandRef);
    }
    const upsertSchema = insertsToUpsert(toUpsert, undefined, caches.schemas.dataAlt![0]);
    await client.createUnigraphUpsert(upsertSchema);
    await caches.schemas.updateNow();
    // 1.5 Create all executables if there are any
    const executables = !(pkg.pkgExecutables && Object.entries(pkg.pkgExecutables))
        ? []
        : Object.entries(pkg.pkgExecutables).map(([key, exec]: any) => {
              const builtExecutable: any = buildUnigraphEntity(exec, '$/schema/executable', caches.schemas.data);
              // eslint-disable-next-line max-len
              builtExecutable[
                  'unigraph.id'
              ] = `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/executable/${key}`;
              builtExecutable['dgraph.type'] = ['Entity', 'Executable'];
              return builtExecutable;
          });
    // 1.7 Create all predefined entities
    const entities = !(pkg.pkgEntities && Object.entries(pkg.pkgEntities))
        ? []
        : Object.entries(pkg.pkgEntities)
              .map(([key, obj]: any) => {
                  const schema = obj?.type?.['unigraph.id'];
                  if (typeof schema === 'string') {
                      delete obj.type;
                      // console.log(JSON.stringify(obj))
                      // console.log(JSON.stringify(caches['schemas'].data[schema]))
                      if (!caches.schemas.data?.[schema]?._definition && caches.schemas.data[schema]?.['_value[']) {
                          // Deal with schema cited only just created now
                          const id = caches.schemas.data[schema]['_value['][0]['unigraph.id'];
                          caches.schemas.data[schema] = caches.schemas.data[id];
                      }
                      const builtEntity: any = buildUnigraphEntity(obj, schema, caches.schemas.data);
                      // eslint-disable-next-line max-len
                      builtEntity[
                          'unigraph.id'
                      ] = `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/entity/${key}`;
                      builtEntity['dgraph.type'] = ['Entity', 'Named'];
                      return builtEntity;
                  }
                  return undefined;
              })
              .filter((x) => x !== undefined);
    if (
        entities.length !== 0 &&
        (typeof pkg.pkgEntities !== 'object' || entities.length !== Object.values(pkg.pkgEntities).length)
    ) {
        throw new SyntaxError('Malformed package declaration, aborting!');
    }
    // TODO: Use concurrency here
    const toUpsert2 = [];
    for (let i = 0; i < executables.length; i += 1) {
        const autoRefExecutable = processAutorefUnigraphId(executables[i]);
        toUpsert2.push(autoRefExecutable);
    }
    for (let i = 0; i < entities.length; i += 1) {
        const autoRefEntity = processAutorefUnigraphId(entities[i]);
        toUpsert2.push(autoRefEntity);
    }
    const upsertEntityExecutable = insertsToUpsert(toUpsert2, undefined, caches.schemas.dataAlt![0]);
    await client.createUnigraphUpsert(upsertEntityExecutable);
    // 2. Create package object and link to all schemas
    const newManifest = buildUnigraphEntity(pkg.pkgManifest, '$/schema/package_manifest', caches.schemas.data);
    const autorefManifest = processAutorefUnigraphId({
        ...newManifest,
        'unigraph.id': `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/manifest`,
    });
    const pkgObj = {
        pkgManifest: getRefQueryUnigraphId(
            `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/manifest`,
        ),
        'dgraph.type': 'Package',
        pkgSchemas: Object.fromEntries(
            schemas.map((schema, i) => [Object.keys(pkg.pkgSchemas)[i], getRefQueryUnigraphId(schema['unigraph.id'])]),
        ),
        pkgExecutables: !(pkg.pkgExecutables && Object.entries(pkg.pkgExecutables))
            ? undefined
            : Object.fromEntries(
                  executables.map((exec, i) => [
                      Object.keys(pkg.pkgExecutables!)[i],
                      getRefQueryUnigraphId(exec['unigraph.id']),
                  ]),
              ),
        pkgEntities: !(pkg.pkgEntities && Object.entries(pkg.pkgEntities))
            ? undefined
            : Object.fromEntries(
                  entities.map((et, i) => [Object.keys(pkg.pkgEntities!)[i], getRefQueryUnigraphId(et['unigraph.id'])]),
              ),
        ...getRefQueryUnigraphId(`$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}`),
    };
    // console.log(JSON.stringify(pkgObj, null, 4));
    const upsertM = insertsToUpsert(
        [
            autorefManifest,
            pkgObj,
            {
                ...getRefQueryUnigraphId('$/meta/namespace_map'),
                ...Object.fromEntries(
                    fullSchemas.map((schema, i) => [
                        `$/${schema['unigraph.id'].split('/').slice(4).join('/')}`,
                        getRefQueryUnigraphId(schema['unigraph.id']),
                    ]),
                ),
                ...(!(pkg.pkgExecutables && Object.entries(pkg.pkgExecutables))
                    ? undefined
                    : Object.fromEntries(
                          executables.map((exec, i) => [
                              `$/executable/${Object.keys(pkg.pkgExecutables!)[i]}`,
                              getRefQueryUnigraphId(exec['unigraph.id']),
                          ]),
                      )),
                ...(!(pkg.pkgEntities && Object.entries(pkg.pkgEntities))
                    ? undefined
                    : Object.fromEntries(
                          entities.map((et, i) => [
                              `$/entity/${Object.keys(pkg.pkgEntities!)[i]}`,
                              getRefQueryUnigraphId(et['unigraph.id']),
                          ]),
                      )),
            },
        ],
        undefined,
        caches.schemas.dataAlt![0],
    );
    await client.createUnigraphUpsert(upsertM);
}

/**
 * Purges old versions of a package.
 */
export const purgeOldVersions = (client: DgraphClient, states: any, pkg: PackageDeclaration) => {
    const shorthandKeys = Object.keys(pkg.pkgSchemas)
        .map((el) =>
            el.startsWith('interface/') ? [`$/schema/${el}`] : [`$/schema/${el}`, `$/schema/interface/${el}`],
        )
        .flat();
    const oldMap = states.caches.schemas.dataAlt[0];
    const delNquads = [];
    shorthandKeys.forEach((key) => {
        const mapResult = oldMap[key]['_value['];
        if (Array.isArray(mapResult)) {
            const quads = mapResult
                .map((el) => {
                    // $/package/pkgName/version/schema/schemaName
                    if (
                        el['unigraph.id']?.split?.('/')[2] !== pkg.pkgManifest.package_name &&
                        el['unigraph.id']?.split?.('/')[3] !== pkg.pkgManifest.version
                    ) {
                        return `<${oldMap[key].uid}> <_value[> <${el.uid}> .`;
                    }
                    return undefined;
                })
                .filter(Boolean);
            delNquads.push(...quads);
        }
    });
};
