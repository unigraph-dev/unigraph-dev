import _ from 'lodash';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';

const matchUids = (old: any[], newstuff: any[]) => {
    return old.map((el) => el.uid) === newstuff.map((el) => el.uid);
};

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

    const onStateUpdated = (newResults: any[]) => {
        try {
            if (!matchUids(states.results, newResults)) {
                stateCallback(newResults);
                states.results = newResults;
            }
        } catch (e) {
            console.log(states.results, newResults, ' matchUid error ', e);
        }
    };

    const onUserNext = (updating: boolean) => {
        const [subsHead, chunksHead] = [Math.floor(states.currentSubs.length / chunk), states.chunks.length];
        if (updating || subsHead < chunksHead) {
            if (updating) {
                states.currentSubs = _.uniq([
                    ...(states.chunks[0] || []),
                    ...states.currentSubs.filter((el) => uids.includes(el)),
                ]);
            } else {
                const toSub = states.chunks[subsHead];
                states.currentSubs = [...states.currentSubs, ...toSub];
            }
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
        const availableUids = _.intersection(uids, newUids);
        uids = newUids;
        states.chunks = _.chunk(uids, chunk);
        onStateUpdated(states.results.filter((el) => availableUids.includes(el.uid)));
        onUserNext(true);
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
            results.forEach
                ? results.forEach((el: any) => {
                      uidsMap[el.uid] = el;
                  })
                : (uidsMap[results.uid] = results);
            onStateUpdated(states.currentSubs.map((el: any) => uidsMap[el]));
        },
        states.subsId,
        subscribeOptions,
    );

    return returns;
};
