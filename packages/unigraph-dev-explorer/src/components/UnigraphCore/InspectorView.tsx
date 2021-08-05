import { Typography } from "@material-ui/core";
import React from "react";
import { getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";

export const InspectorView = () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const [objectsMap, _setObjectsMap] = React.useState<any>({});
    const objectsMapRef = React.useRef<any>({});
    const subIdMapRef = React.useRef<Record<string, any>>({});

    React.useEffect(() => {
        window.unigraph.getState('global/selected').subscribe((newVal: string[]) => {setSelected(newVal)})
    }, []);

    const setObjectsMap = (newMap: any) => {
        objectsMapRef.current = newMap;
        _setObjectsMap(newMap);
    }

    React.useEffect(() => {
        selected.forEach((uid) => {
            if (subIdMapRef.current[uid] === undefined) {
                const newSub = getRandomInt();
                subIdMapRef.current[uid] = newSub;
                window.unigraph.subscribeToObject(uid, (obj: any) => {
                    setObjectsMap({...objectsMapRef.current, [uid]: obj})
                }, newSub)
            }
        });
        const cleanup = () => {
            Object.keys(subIdMapRef.current).forEach((uid) => {
                if (!selected.includes(uid) && subIdMapRef.current[uid] !== undefined) window.unigraph.unsubscribe(subIdMapRef.current[uid]);
            })
        }
        cleanup();
        return cleanup;
    }, [selected])

    return <div>
        {selected.length === 0? <Typography>Select items to inspect</Typography> : <div>
            <Typography>Selected {selected.length.toString()} items.</Typography>
            {selected.map((uid: string) => {
                return objectsMapRef.current[uid] ? <div>Uid: {uid}, type: {objectsMapRef.current[uid].type['unigraph.id']}, last updated: {objectsMapRef.current[uid]?._timestamp?._updatedAt || "unknown"}</div> : <div>{uid}</div>
            })}    
        </div>}
    </div>
}