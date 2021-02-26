import DgraphClient from "./dgraphClient";
import { defaultTypes, defaultUserlandSchemas } from "./templates/defaultDb"
import { insertsToUpsert } from "./utils/txnWrapper";

export async function checkOrCreateDefaultDataModel(client: DgraphClient) {

    const unigraphObject: unknown[] = await client.queryUnigraphId<unknown[]>('$/unigraph');

    if (unigraphObject.length < 1) {
        // Insert default data
        await client.setSchema(defaultTypes);
        await client.createUnigraphUpsert(insertsToUpsert(defaultUserlandSchemas));
    } else {
        // Everything is OK, returning
    }

}