import { Divider, Typography } from '@material-ui/core';
import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { TabContext } from '../../utils';
import { ObjectOverview } from '../ObjectView/ObjectOverview';

export function InspectorView() {
    const [selected, setSelected] = React.useState<string[]>([]);
    const [objectsMap, _setObjectsMap] = React.useState<any>({});
    const objectsMapRef = React.useRef<any>({});
    const subIdMapRef = React.useRef<Record<string, any>>({});
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        setSelected(window.unigraph.getState('global/selected').value);
        window.unigraph.getState('global/selected').subscribe((newVal: string[]) => { setSelected(newVal); });
    }, []);

    const setObjectsMap = (newMap: any) => {
        objectsMapRef.current = newMap;
        _setObjectsMap(newMap);
    };

    React.useEffect(() => {
        selected.forEach((uid) => {
            if (subIdMapRef.current[uid] === undefined) {
                const newSub = getRandomInt();
                subIdMapRef.current[uid] = newSub;
                tabContext.subscribeToObject(uid, (obj: any) => {
                    setObjectsMap({ ...objectsMapRef.current, [uid]: obj });
                }, newSub);
            }
        });
        const cleanup = () => {
            Object.keys(subIdMapRef.current).forEach((uid) => {
                if (!selected.includes(uid) && subIdMapRef.current[uid] !== undefined) {
                    tabContext.unsubscribe(subIdMapRef.current[uid]);
                }
            });
        };
        cleanup();
        return cleanup;
    }, [selected]);

    return (
        <div>
            {selected.length === 0 ? <Typography>Select items to inspect</Typography> : (
                <div>
                    <Typography>
                        Selected
                        {selected.length.toString()}
                        {' '}
                        items.
                    </Typography>
                    <Divider />
                    {selected.map((uid: string) => (objectsMapRef.current[uid] ? (
                        <>
                            <ObjectOverview data={objectsMapRef.current[uid]} />
                            <Divider />
                        </>
                    ) : <div>{uid}</div>))}
                </div>
            )}
        </div>
    );
}
