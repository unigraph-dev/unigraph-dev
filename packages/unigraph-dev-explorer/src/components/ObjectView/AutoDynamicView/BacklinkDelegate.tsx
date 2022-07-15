import React from 'react';
import { subscribeToBacklinks } from '../../../unigraph-react';
import { DataContext, typeHasDynamicView } from '../../../utils';
import { getParentsAndReferences } from '../backlinksUtils';

const getLinkFrequency = (links: any[]) => {
    const freq: any = {};
    links.forEach((link) => {
        if (!freq[link.type['unigraph.id']]) freq[link.type['unigraph.id']] = 0;
        freq[link.type['unigraph.id']] += 1;
    });
    return Object.entries(freq);
};

export const useBacklinkDelegate = (
    uid: string,
    contextUid: string,
    shouldGetBacklinks: boolean,
    noParents?: boolean,
    backlinkStyle?: any,
) => {
    const [backlinks, setBacklinks] = React.useState<any>([]);
    const [totalParents, setTotalParents] = React.useState<string[] | undefined>();
    const dataContext = React.useContext(DataContext);

    React.useEffect(() => {
        if (uid?.startsWith('0x') && shouldGetBacklinks) {
            // console.log(uid, dataContext.getParents(true));
            const cb = (newBacklinks: any) => {
                const [pars, refs] = getParentsAndReferences(
                    newBacklinks['~_value'],
                    newBacklinks['unigraph.origin'],
                    uid,
                );
                // console.log(object.uid, getParents(viewEl.current));
                const processedBacklinks: any = [pars, refs].map((it) =>
                    it.filter(
                        (el) =>
                            typeHasDynamicView(el?.type?.['unigraph.id']) &&
                            ![...dataContext.getParents(true), contextUid].includes(el.uid),
                    ),
                );
                setBacklinks((oldBacklinks: any) => {
                    if (
                        JSON.stringify(oldBacklinks[0]?.map((el: any) => el.uid).sort()) !==
                            JSON.stringify(processedBacklinks[0]?.map((el: any) => el.uid).sort()) ||
                        JSON.stringify(oldBacklinks[1]?.map((el: any) => el.uid).sort()) !==
                            JSON.stringify(processedBacklinks[1]?.map((el: any) => el.uid).sort())
                    ) {
                        return processedBacklinks;
                    }
                    return oldBacklinks;
                });
                setTotalParents((oldParents: any) => {
                    const newParents = [...(pars || []).map((el) => el.uid)];
                    if (JSON.stringify(oldParents?.sort()) !== JSON.stringify(newParents?.sort())) return newParents;
                    return oldParents;
                });
            };
            subscribeToBacklinks(uid, cb);
            return function cleanup() {
                subscribeToBacklinks(uid, cb, true);
            };
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
    }, [uid, contextUid, shouldGetBacklinks, JSON.stringify(dataContext?.getParents(true)?.sort())]);

    const BacklinkComponent = React.useMemo(
        () =>
            shouldGetBacklinks &&
            dataContext.parents !== undefined &&
            (backlinks?.[1]?.length || (!noParents && backlinks?.[0]?.length > 0)) ? (
                <div
                    style={{
                        marginLeft: 'auto',
                        background: 'lightgray',
                        padding: '2px 6px',
                        paddingRight: '2px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        height: 'fit-content',
                        ...backlinkStyle,
                    }}
                    onClick={(ev) => {
                        ev.stopPropagation();
                        ev.preventDefault();
                        window.wsnavigator(`/library/backlink?uid=${uid}`);
                    }}
                >
                    {getLinkFrequency([...(noParents ? [] : backlinks?.[0] || []), ...(backlinks?.[1] || [])]).map(
                        (el) => (
                            <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px', opacity: 0.54 }}>
                                <div
                                    style={{
                                        height: '16px',
                                        width: '16px',
                                        backgroundImage: `url("data:image/svg+xml,${
                                            window.unigraph.getNamespaceMap?.()?.[el[0]]?._icon
                                        }"`,
                                        marginRight: '4px',
                                    }}
                                />
                                {el[1]}
                            </div>
                        ),
                    )}
                </div>
            ) : (
                []
            ),
        [noParents, backlinks[0]?.length, backlinks[1]?.length, dataContext.parents === undefined, shouldGetBacklinks],
    );

    return [totalParents, BacklinkComponent];
};
