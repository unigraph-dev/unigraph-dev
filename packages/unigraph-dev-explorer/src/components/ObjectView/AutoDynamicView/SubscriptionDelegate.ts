import React from 'react';
import { getRandomInt, buildGraph } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../../utils';
import { isStub } from '../utils';

export const useSubscriptionDelegate: (...args: any) => [() => any, number] = (
    uid: string,
    objectView: any,
    object: any,
) => {
    const tabContext = React.useContext(TabContext);

    const isObjectStub = isStub(object);
    const [loadedObj, setLoadedObj] = React.useState<any>(false);
    const [subsId, setSubsId] = React.useState(0);

    const getObject = React.useCallback(() => (isObjectStub ? loadedObj : object), [loadedObj, object, isObjectStub]);

    React.useEffect(() => {
        if (!isObjectStub) setLoadedObj(object);
    }, [object, isObjectStub]);
    const uidRef = React.useRef(undefined);
    React.useEffect(() => {
        const newSubs = getRandomInt();
        console.log(newSubs, isObjectStub);
        if (isObjectStub && object?.uid !== uidRef.current) {
            uidRef.current = object?.uid;
            // console.log(tabContext);
            // if (subsId) tabContext.unsubscribe(subsId);
            let query = objectView?.query?.(object.uid);
            if (!query) {
                query = `(func: uid(${object.uid})) @recurse {
                uid
                unigraph.id
                expand(_userpredicate_)
              }`;
            }
            tabContext.subscribeToQuery(
                query,
                (objects: any[]) => {
                    setLoadedObj(buildGraph(objects)[0]);
                },
                newSubs,
                { noExpand: true },
            );
            setSubsId(newSubs);
        }
        if (!isObjectStub && uidRef.current !== undefined) {
            uidRef.current = undefined;
            tabContext.unsubscribe(newSubs);
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
    }, [object?.uid, isObjectStub, objectView, object?.type]);

    return [getObject, subsId];
};
