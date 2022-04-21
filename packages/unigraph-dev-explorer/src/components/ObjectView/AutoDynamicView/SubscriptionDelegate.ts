import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../../utils';
import { isStub } from '../utils';

const getQueryFromObjectView = (objectView: any) => {
    let query = objectView?.query?.('QUERYFN_TEMPLATE');
    if (!query) {
        query = `(func: uid(QUERYFN_TEMPLATE)) @recurse {
        uid
        unigraph.id
        expand(_userpredicate_)
        }`;
    }
    return query;
};

const getSubsCache = () => window.unigraph.getState('global/subscriptionCache');
const getKey = (uid: string, objectView: any) => `${uid}_${getQueryFromObjectView(objectView)}`;
const getObjectCache = (uid: string, objectView: any) => getSubsCache().value[getKey(uid, objectView)];

export const useSubscriptionDelegate: (...args: any) => [() => any, number] = (
    uid: string,
    objectView: any,
    object: any,
) => {
    const tabContext = React.useContext(TabContext);

    const isObjectStub = isStub(object);
    const [loadedObj, setLoadedObj] = React.useState<any>(false);
    const [subsId, setSubsId] = React.useState(0);

    const getObject = React.useCallback(() => {
        let obj;
        if (isObjectStub) {
            if (subsId === 0 && loadedObj === false && getObjectCache(uid, objectView)) {
                obj = getObjectCache(uid, objectView);
            } else {
                obj = loadedObj;
            }
        } else {
            obj = object;
        }
        if (obj?.constructor.name !== 'UnigraphObject' && obj?.uid) obj = new UnigraphObject(obj);
        return obj;
    }, [loadedObj, object, isObjectStub]);

    React.useEffect(() => {
        if (!isObjectStub) setLoadedObj(object);
    }, [isObjectStub]);
    const uidRef = React.useRef(undefined);
    React.useEffect(() => {
        const newSubs = getRandomInt();
        if (isObjectStub && object?.uid !== uidRef.current) {
            // console.log(tabContext);
            // if (subsId) tabContext.unsubscribe(subsId);
            const query = getQueryFromObjectView(objectView);
            tabContext.subscribe(
                {
                    type: 'object',
                    uid: [object?.uid],
                    options: {
                        queryFn: query,
                    },
                },
                (newObjects: any[]) => {
                    uidRef.current = object?.uid;
                    getSubsCache().setValue({ ...getSubsCache().value, [getKey(uid, objectView)]: newObjects[0] });
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
