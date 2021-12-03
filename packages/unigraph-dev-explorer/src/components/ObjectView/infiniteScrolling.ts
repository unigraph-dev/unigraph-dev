import _ from "lodash"
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";

/**
 * Manages the data side of an infinite scrolling view.
 * Deals with subscribing/unsubscribing objects in response to the user's action.
 * @param uids A list of UIDs in string format consisting all the items.
 * @param chunk Number, default to 50, meaning how much objects to get in a given subscription.
 * @param stateCallback A callback that would be called every time loaded items are updated.
 */
export const setupInfiniteScrolling = (uids: string[], chunk = 50, stateCallback: (loadedItems: any[]) => void, subscribeOptions?: any) => {

    const states = {
        subs: [] as any[],
        chunks: _.chunk(uids, chunk),
    }

    const onStateUpdated = () => {
        const items = states.subs.reduce((prev: any[], curr: any) => [...prev, ...curr.result], []);
        stateCallback(items);
    }

    const onUserNext = () => {
        const [subsHead, chunksHead] = [states.subs.length, states.chunks.length];
        if (subsHead < chunksHead) {
            const toSub = states.chunks[subsHead];
            const subsId = getRandomInt();
            states.subs.push({id: subsId, result: []});
            window.unigraph.subscribeToObject(toSub, (results: any[] | any) => {
                let uidsMap: any = {};
                results.forEach ? results.forEach((el: any) => {uidsMap[el.uid] = el}) : uidsMap[results.uid] = results;
                states.subs[subsHead].result = toSub.map(el => uidsMap[el]);
                onStateUpdated();
            }, subsId, subscribeOptions);
        }
    }

    const onCleanup = () => {
        states.subs.forEach(el => window.unigraph.unsubscribe(el.id));
        stateCallback = () => {};
    }

    const returns = {
        next: onUserNext,
        cleanup: onCleanup
    }

    return returns;
}