import { PackageDeclaration } from 'unigraph-dev-common/lib/types/packages';
import {
    unpad,
    processAutorefUnigraphId,
    buildUnigraphEntity,
    isRaw,
    replaceUnigraphIds,
} from 'unigraph-dev-common/lib/utils/entityUtils';
import { insertsToUpsert } from 'unigraph-dev-common/lib/utils/txnWrapper';
import { getRefQueryUnigraphId } from 'unigraph-dev-common/lib/utils/utils';
import dgraph from 'dgraph-js';
import DgraphClient from './dgraphClient';
import { Cache } from './caches';

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

    const replacer = (unigraphId: string) =>
        unigraphId.startsWith('$./')
            ? unigraphId.replace('$./', `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/`)
            : unigraphId;

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
                      replaceUnigraphIds(obj, replacer);
                      if (!caches.schemas.data?.[schema]?._definition && caches.schemas.data[schema]?.['_value[']) {
                          // Deal with schema cited only just created now
                          const id = caches.schemas.data[schema]['_value['][0]['unigraph.id'];
                          caches.schemas.data[schema] = caches.schemas.data[id];
                      }
                      const builtEntity: any = isRaw(obj) ? obj : buildUnigraphEntity(obj, schema, caches.schemas.data);
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
export const purgeOldVersions = async (client: DgraphClient, states: any, pkg: PackageDeclaration) => {
    const shorthandKeys = Object.keys(pkg.pkgSchemas)
        .map((el) =>
            el.startsWith('interface/') ? [`$/schema/${el}`] : [`$/schema/${el}`, `$/schema/interface/${el}`],
        )
        .flat();
    const oldMap = states.caches.schemas.dataAlt[0];
    const delNquads: string[] = [];
    shorthandKeys.forEach((key) => {
        const mapResult = oldMap[key]?.['_value['];
        if (Array.isArray(mapResult)) {
            // @ts-expect-error: already checked for boolean
            const quads: string[] = mapResult
                .map((el) => {
                    // $/package/pkgName/version/schema/schemaName
                    if (
                        el['unigraph.id']?.split?.('/')[2] === pkg.pkgManifest.package_name &&
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
    const deleteNquads = new dgraph.Mutation();
    deleteNquads.setDelNquads(delNquads.join('\n'));
    await client.createDgraphUpsert({
        query: false,
        mutations: [deleteNquads],
    });
};

/**
 * Disables a package from Unigraph.
 *
 * @param client
 * @param states
 * @param pkgName
 */
export const disablePackage = async (
    client: DgraphClient,
    states: any,
    pkgName: string,
    enable = false,
    del = false,
    exceptVersion: string | undefined = undefined,
) => {
    // First, get all data in the database for this package
    const pkgContent = (
        await client.queryDgraph(`query {
    q(func: between(<unigraph.id>, "$/package/${pkgName}/", "$/package/${pkgName}0")) {
            uid
            <unigraph.id>
    }}`)
    )[0].filter((el: any) => el['unigraph.id'].split('/')[3] !== exceptVersion);
    const shorthandRefs = pkgContent
        .map((el: any) => {
            const struct = el['unigraph.id'].split('/');
            struct[5] = struct.slice(5).join('/');
            // A sample struct would be ['$', 'package', '<pkgName>', '<version>', 'schema', '<schemaName>']
            if (struct[4] && struct[5] && ['schema', 'executable', 'entity'].includes(struct[4])) {
                return { from: `$/${struct[4]}/${struct[5]}`, to: el.uid };
            }
            return undefined;
        })
        .filter(Boolean);

    // Now we should remove/restore all shorthand references and set package content to be hidden/shown
    const nsMapNquads = shorthandRefs
        .map((el: any) => `<${states.namespaceMap.uid}> <${el.from}> <${el.to}> .`)
        .join('\n');
    const deleteNquads = new dgraph.Mutation();
    deleteNquads.setDelNquads(nsMapNquads);
    const setNquads = new dgraph.Mutation();
    setNquads.setSetNquads(nsMapNquads);

    const deleteAllNquads = new dgraph.Mutation();
    deleteAllNquads.setDelNquads(del ? pkgContent.map((el: any) => `<${el.uid}> * * .`).join('\n') : '');

    const hideNquads = new dgraph.Mutation();
    hideNquads.setSetNquads(
        pkgContent.map((el: any) => `<${el.uid}> <_hide> "${enable ? 'false' : 'true'}" .`).join('\n'),
    );
    const result = await client.createDgraphUpsert({
        query: false,
        mutations: [enable ? setNquads : deleteNquads, hideNquads, deleteAllNquads],
    });
    console.log('Disabled/Enabled package: ', pkgName);
    await states.caches.schemas.updateNow();
    return result;
};

export const enablePackage = async (client: DgraphClient, states: any, pkgName: string) =>
    disablePackage(client, states, pkgName, true);

export const premergeEntities = async (client: DgraphClient, states: any, pkgName: string, newVersion: string) => {
    const pkgContent = (
        await client.queryDgraph(`query {
    q(func: between(<unigraph.id>, "$/package/${pkgName}/", "$/package/${pkgName}0")) {
            uid
            <unigraph.id>
    }}`)
    )[0];
    const newVersions = pkgContent
        .map((el: any) => {
            const struct = el['unigraph.id'].split('/');
            struct[5] = struct.slice(5).join('/');
            // A sample struct would be ['$', 'package', '<pkgName>', '<version>', 'schema', '<schemaName>']
            if (struct[4] && struct[5] && ['executable', 'entity'].includes(struct[4])) {
                struct[3] = newVersion;
                return { from: el.uid, to: struct.join('/') };
            }
            return undefined;
        })
        .filter(Boolean);

    const newVersionsNquads = newVersions.map((el: any) => `<${el.from}> <unigraph.id> "${el.to}" .`).join('\n');
    const setNquads = new dgraph.Mutation();
    setNquads.setSetNquads(newVersionsNquads);
    const result = await client.createDgraphUpsert({
        query: false,
        mutations: [setNquads],
    });
    await states.caches.schemas.updateNow();
    return result;
};

export const updatePackage = async (client: DgraphClient, states: any, pkg: PackageDeclaration) => {
    await premergeEntities(client, states, pkg.pkgManifest.package_name, pkg.pkgManifest.version);
    await disablePackage(client, states, pkg.pkgManifest.package_name, false, true, pkg.pkgManifest.version);
    await purgeOldVersions(client, states, pkg);
    await addUnigraphPackage(client, pkg, states.caches);
    await enablePackage(client, states, pkg.pkgManifest.package_name);
};
