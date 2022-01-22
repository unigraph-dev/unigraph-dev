import _ from 'lodash';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { buildGraph } from 'unigraph-dev-common/lib/utils/utils';

/**
 * Manages the data side of an infinite scrolling view.
 * Deals with subscribing/unsubscribing objects in response to the user's action.
 * @param uids A list of UIDs in string format consisting all the items.
 * @param chunk Number, default to 50, meaning how much objects to get in a given subscription.
 * @param stateCallback A callback that would be called every time loaded items are updated.
 */
export const setupInfiniteScrolling = (
    uids: string[],
    // eslint-disable-next-line default-param-last
    chunk = 50,
    stateCallback: (loadedItems: any[]) => void,
    tabContext: any,
    subscribeOptions?: any,
) => {
    const states = {
        results: [] as any[],
        currentSubs: [] as string[],
        chunks: _.chunk(uids, chunk),
        subsId: getRandomInt(),
    };

    const onStateUpdated = () => {
        stateCallback(states.results);
    };

    const onUserNext = () => {
        const [subsHead, chunksHead] = [states.currentSubs.length / chunk, states.chunks.length];
        if (subsHead < chunksHead) {
            const toSub = states.chunks[subsHead];
            states.currentSubs = [...states.currentSubs, ...toSub];
            tabContext.subscribe(
                {
                    type: 'object',
                    uid: states.currentSubs,
                    options: subscribeOptions,
                },
                () => false,
                states.subsId,
                true,
            );
        }
    };

    const onUpdate = (newUids: string[]) => {
        if (_.isEqual(uids, newUids)) return;
        uids = newUids;
        states.chunks = _.chunk(uids, chunk);
        states.results = [];
        states.currentSubs = [];
        onUserNext();
    };

    const onCleanup = () => {
        tabContext.unsubscribe(states.subsId);
        stateCallback = () => false;
    };

    const returns = {
        next: onUserNext,
        cleanup: onCleanup,
        onUpdate,
    };

    const toSub = states.chunks[0] || [];
    states.currentSubs = toSub;
    tabContext.subscribeToObject(
        toSub,
        (results: any[] | any) => {
            const uidsMap: any = {};
            buildGraph(results);
            results.forEach
                ? results.forEach((el: any) => {
                      uidsMap[el.uid] = el;
                  })
                : (uidsMap[results.uid] = results);
            states.results = states.currentSubs.map((el: any) => uidsMap[el]);
            onStateUpdated();
        },
        states.subsId,
        subscribeOptions,
    );

    return returns;
};
