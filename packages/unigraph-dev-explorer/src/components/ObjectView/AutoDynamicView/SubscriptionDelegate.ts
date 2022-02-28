import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
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
    }, [isObjectStub]);
    const uidRef = React.useRef(undefined);
    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub && object?.uid !== uidRef.current) {
            uidRef.current = object?.uid;
            // console.log(tabContext);
            // if (subsId) tabContext.unsubscribe(subsId);
            let query = objectView?.query?.('QUERYFN_TEMPLATE');
            if (!query) {
                query = `(func: uid(QUERYFN_TEMPLATE)) @recurse {
                uid
                unigraph.id
                expand(_userpredicate_)
              }`;
            }
            tabContext.subscribe(
                {
                    type: 'object',
                    uid: [object?.uid],
                    options: {
                        queryFn: query,
                    },
                },
                (newObjects: any[]) => {
                    setLoadedObj(newObjects[0]);
                },
                newSubs,
            );
            setSubsId(newSubs);
        }
        if (!isObjectStub && uidRef.current !== undefined) {
            setLoadedObj(object);
            uidRef.current = undefined;
            tabContext.unsubscribe(newSubs);
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
    }, [object?.uid, isObjectStub, objectView]);

    return [getObject, subsId];
};
