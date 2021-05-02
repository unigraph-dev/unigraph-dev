/**
 * This manager file defines relevant logic and criterions to ensure data model, package and schema consistency.
 * 
 * The corresponding docs pages are namespaces.md, schemas_and_objects.md, data_model.md, apps.md.
 */

import DgraphClient from "./dgraphClient";
import { defaultPackages, defaultTypes, defaultUserlandSchemas, packageManifestSchema } from "./templates/defaultDb"
import { insertsToUpsert } from "./utils/txnWrapper";
import { Cache } from './caches';
import { PackageDeclaration } from "unigraph-dev-common/lib/types/packages";
import { ComposerUnionInstance } from "unigraph-dev-common/lib/types/json-ts";
import { buildUnigraphEntity, processAutoref, unpad } from "unigraph-dev-common/lib/utils/entityUtils";

export async function checkOrCreateDefaultDataModel(client: DgraphClient) {

    const unigraphObject: unknown[] = await client.queryUnigraphId<unknown[]>('$/unigraph');

    if (unigraphObject.length < 1) {
        // Insert default data
        await client.setSchema(defaultTypes);
        await client.createUnigraphUpsert(insertsToUpsert(defaultUserlandSchemas));
        for (let i=0; i<defaultPackages.length; ++i) {
            await addUnigraphPackage(client, defaultPackages[i],
                {'schemas': {data: Object.fromEntries(defaultUserlandSchemas.map(el => [el["unigraph.id"], el]))} as Cache<any>});
        }
    } else {
        // Everything is OK, returning
    }

}

export function createSchemaCache(client: DgraphClient): Cache<any> {

    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: "manual",
        subscribe: (listener) => null
    };

    cache.updateNow = async () => { 
        const newdata = await client.getSchemasFromTable();
        cache.data = newdata;
        // Remove all non-schema objects items first
        Object.entries(cache.data).forEach(([k, v]: any) => {
            if (k.startsWith("$/schema/interface/")) {
                const defn = v._definition as ComposerUnionInstance;
                defn._parameters._definitions = [];
            }
            if (!k.startsWith('$/schema')) {
                cache.data[k] = undefined
            }
        })
        const newdata2 = await client.getSchemas();
        newdata2.forEach((obj: any) => {
            if (obj && typeof obj["unigraph.id"] === "string" && obj["unigraph.id"].split("/").reverse()[1] === 'interface') {
                // This is an interface object
                const defn = obj._definition as ComposerUnionInstance;
                const revPath = obj["unigraph.id"].split("/").reverse();
                if (cache.data[`$/schema/interface/${revPath[0]}`]._definition?._parameters?._definitions?.length) 
                    (cache.data[`$/schema/interface/${revPath[0]}`]._definition as ComposerUnionInstance)
                        ._parameters._definitions?.push(...defn._parameters._definitions)
            } 
            if (obj && typeof obj["unigraph.id"] === "string" && obj["unigraph.id"].includes('/schema/')) {
                cache.data[obj["unigraph.id"]] = obj;
            }
        })
    };

    cache.updateNow();

    return cache;
}

export function createPackageCache(client: DgraphClient): Cache<any> {
    
    const cache: Cache<any> = {
        data: {},
        updateNow: async () => null,
        cacheType: "manual",
        subscribe: (listener) => null
    };

    cache.updateNow = async () => { 
        const newdata = await client.getPackages();
        cache.data = newdata.reduce((prev, obj) => {
            obj.pkgManifest = unpad(obj.pkgManifest);
            if (obj && obj.pkgManifest && obj.pkgManifest.package_name) {
                prev[obj.pkgManifest.package_name] = obj;
            }
            return prev;
        }, {})
    };

    cache.updateNow();

    return cache;

}

export async function addUnigraphPackage(client: DgraphClient, pkg: PackageDeclaration, caches: Record<string, Cache<any>>) {
    // 1. Create all schemas associated with the package in the correct namespace
    const schemas = Object.entries(pkg.pkgSchemas).map(([key, schema]) => {
        return {
            "unigraph.id": `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/schema/${key}`,
            ...schema
        }
    });
    // 1.5 Create all executables if there are any
    const executables = !(pkg.pkgExecutables && Object.entries(pkg.pkgExecutables)) ? [] : Object.entries(pkg.pkgExecutables).map(([key, exec]: any) => {
        const builtExecutable = buildUnigraphEntity(exec, "$/schema/executable", caches['schemas'].data);
        const autoRefExecutable = processAutoref(builtExecutable, "$/schema/executable", caches['schemas'].data);
        autoRefExecutable['unigraph.id'] = `$/package/${pkg.pkgManifest.package_name}/${pkg.pkgManifest.version}/executable/${key}`;
        autoRefExecutable['dgraph.type'] = ['Entity', 'Executable']
        return autoRefExecutable
    })
    // TODO: Use concurrency here
    for(let i=0; i<schemas.length; ++i) {
        const schemaShorthandRef = {
            "unigraph.id": `$/schema/${Object.keys(pkg.pkgSchemas)[i]}`,
            "_value[": {
                "$ref": {
                    "query": [
                        {
                            "key": "unigraph.id",
                            "value": schemas[i]["unigraph.id"]
                        }
                    ]
                }
            }
        }
        const upsert = insertsToUpsert([schemas[i]]);
        await client.createUnigraphUpsert(upsert)
        const upsert2 = insertsToUpsert([schemaShorthandRef]);
        await client.createUnigraphUpsert(upsert2)
    }
    for(let i=0; i<executables.length; ++i) {
        const upsert = insertsToUpsert([executables[i]]);
        await client.createUnigraphUpsert(upsert)
    }
    // 2. Create package object and link to all schemas
    const newManifest = buildUnigraphEntity(pkg.pkgManifest, '$/schema/package_manifest', caches['schemas'].data);
    const autorefManifest = processAutoref(newManifest, "$/schema/package_manifest", caches['schemas'].data);
    const pkgObj = {
        pkgManifest: autorefManifest,
        "dgraph.type": "Package",
        pkgSchemas: Object.fromEntries(schemas.map((schema, i) => [Object.keys(pkg.pkgSchemas)[i], {
            "$ref": {
                "query": [
                    {
                        "key": "unigraph.id",
                        "value": schema["unigraph.id"]
                    }
                ]
            }
        }])),
        pkgExecutables: !(pkg.pkgExecutables && Object.entries(pkg.pkgExecutables)) ? undefined : Object.fromEntries(executables.map((exec, i) => [Object.keys(pkg.pkgExecutables!)[i], {
            "$ref": {
                "query": [
                    {
                        "key": "unigraph.id",
                        "value": exec["unigraph.id"]
                    }
                ]
            }
        }]))
    }
    console.log(pkgObj)
    const upsert = insertsToUpsert([pkgObj]);
    await client.createUnigraphUpsert(upsert);
    // 3. Update schema reference table for these schemas
    const upsert2 = insertsToUpsert([{
        "$ref": {
            "query": [
                {
                    "key": "unigraph.id",
                    "value": "$/meta/namespace_map"
                }
            ]
        },
        ...Object.fromEntries(schemas.map((schema, i) => [`$/schema/${Object.keys(pkg.pkgSchemas)[i]}`, {
            "$ref": {
                "query": [
                    {
                        "key": "unigraph.id",
                        "value": schema["unigraph.id"]
                    }
                ]
            }
        }])),
        ...!(pkg.pkgExecutables && Object.entries(pkg.pkgExecutables)) ? undefined : Object.fromEntries(executables.map((exec, i) => [`$/executable/${Object.keys(pkg.pkgExecutables!)[i]}`, {
            "$ref": {
                "query": [
                    {
                        "key": "unigraph.id",
                        "value": exec["unigraph.id"]
                    }
                ]
            }
        }]))
    }])
    await client.createUnigraphUpsert(upsert2);
}
