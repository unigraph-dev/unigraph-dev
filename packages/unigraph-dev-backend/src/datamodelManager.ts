/**
 * This manager file defines relevant logic and criterions to ensure data model, package and schema consistency.
 * 
 * The corresponding docs pages are namespaces.md, schemas_and_objects.md, data_model.md, apps.md.
 */

import DgraphClient from "./dgraphClient";
import { defaultPackages, defaultTypes, defaultUserlandSchemas } from "./templates/defaultDb"
import { insertsToUpsert } from "./utils/txnWrapper";
import { Cache } from './caches';
import { PackageDeclaration } from "unigraph-dev-common/lib/types/packages";
import { ComposerUnionInstance } from "unigraph-dev-common/lib/types/json-ts";

export async function checkOrCreateDefaultDataModel(client: DgraphClient) {

    const unigraphObject: unknown[] = await client.queryUnigraphId<unknown[]>('$/unigraph');

    if (unigraphObject.length < 1) {
        // Insert default data
        await client.setSchema(defaultTypes);
        await client.createUnigraphUpsert(insertsToUpsert(defaultUserlandSchemas));
        for (let i=0; i<defaultPackages.length; ++i) {
            await addUnigraphPackage(client, defaultPackages[i]);
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
        // Remove all interface objects items first
        Object.entries(cache.data).forEach(([k, v]: any) => {
            if (k.startsWith("$/schema/interface/")) {
                const defn = v.definition as ComposerUnionInstance;
                defn.parameters.definitions = [];
            }
        })
        const newdata2 = await client.getSchemas();
        newdata2.forEach((obj: any) => {
            if (obj && typeof obj["unigraph.id"] === "string" && obj["unigraph.id"].split("/").reverse()[1] === 'interface') {
                // This is an interface object
                const defn = obj.definition as ComposerUnionInstance;
                const revPath = obj["unigraph.id"].split("/").reverse();
                (cache.data[`$/schema/interface/${revPath[0]}`].definition as ComposerUnionInstance)
                    .parameters.definitions.push(...defn.parameters.definitions)
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
            if (obj && obj.pkgManifest && obj.pkgManifest.pkgPackageName) {
                prev[obj.pkgManifest.pkgPackageName] = obj;
            }
            return prev;
        }, {})
    };

    cache.updateNow();

    return cache;

}

export async function addUnigraphPackage(client: DgraphClient, pkg: PackageDeclaration) {
    // 1. Create all schemas associated with the package in the correct namespace
    const schemas = Object.entries(pkg.pkgSchemas).map(([key, schema]) => {
        return {
            "unigraph.id": `$/package/${pkg.pkgManifest.pkgPackageName}/${pkg.pkgManifest.pkgVersion}/schema/${key}`,
            ...schema
        }
    });
    // TODO: Use concurrency here
    for(let i=0; i<schemas.length; ++i) {
        const upsert = insertsToUpsert([schemas[i]]);
        await client.createUnigraphUpsert(upsert)
    }
    // 2. Create package object and link to all schemas
    const pkgObj = {
        pkgManifest: pkg.pkgManifest,
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
        }]))
    }
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
        }]))
    }])
    await client.createUnigraphUpsert(upsert2);
}
