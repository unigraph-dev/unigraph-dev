import { ListItem, Typography } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useEffectOnce } from 'react-use';
import { buildGraph, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicView } from '../ObjectView/DefaultObjectView';

const UserLibraryAll = ({id}: any) => {

    const [data, setData] = React.useState<UnigraphObject[]>([]);
    const [loadedItems, setLoadedItems] = React.useState<UnigraphObject[]>([]);
    const [subs, setSubs] = React.useState<any[]>([]);
    const subsRef = React.useRef<any>([]);
    const [reload, setReload] = React.useState(0);
    const [chunks, setChunks] = React.useState<any[][]>(_.chunk(data, 100));

    React.useEffect(() => { setChunks(_.chunk(data, 100)) }, [data]);

    React.useEffect(() => { 
        subsRef.current = subs;
        if (!(loadedItems.length && !subs.length)) { 
            const newItems = subs.reduce((prev: any[], current: any) => {
                prev.push(...current.results); 
                return prev;
            }, []);
            setLoadedItems(buildGraph(newItems).filter((el: any) => 
                (Object.keys(window.unigraph.getState('registry/dynamicView').value)
                    .includes(el?.type?.['unigraph.id'])) && el?.type?.['unigraph.id'] !== "$/schema/markdown"));
        }
    }, [subs]);

    React.useEffect(() => {
        if (reload !== 0 && subs.length === 0) {
            for(let i=0; i<reload; ++i) {
                nextGroup();
            };
            setReload(0);
        }
    }, [subs, reload])

    React.useEffect(() => {console.log(loadedItems)}, [loadedItems])

    useEffectOnce(() => {
        const subsId = getRandomInt();
        window.unigraph.subscribeToType("any", (result: any[]) => {setData(result)}, subsId, {uidsOnly: true});

        return function cleanup() { window.unigraph.unsubscribe(subsId); }
    })

    const setSubResult = React.useCallback((data: any[], index: number) => {
        let newSubs = [...subsRef.current];
        if (newSubs[index]) {
            newSubs[index].results = data;
            setSubs(newSubs)
        };
    }, [subs]);
    const nextGroup = () => {
        console.log("Showing next group...", subs.length)
        if (chunks[subs.length]?.length) {
            const subId = getRandomInt();
            const thisSub = {id: subId, results: [] };
            console.log(chunks[subs.length].map((el: any) => el.uid));
            window.unigraph.subscribeToObject(chunks[subs.length].map((el: any) => el.uid), (results: any[]) => {
                let resultsMap: any = {};
                results.forEach((el: any) => resultsMap[el.uid] = el);
                setSubResult(chunks[subs.length].map((el: any) => resultsMap[el.uid]), subs.length);
            }, subId);
            setSubs([...subs, thisSub]);
        }
    };

    React.useEffect(() => {
        const nextGroups = subs.length || 1;
        const cleanup = () => {
            subsRef.current.forEach((el: any) => {
                window.unigraph.unsubscribe(el.id);
        })};
        cleanup();
        setSubs([]);
        setReload(nextGroups);
        return cleanup;
    }, [chunks])

    /*
    return <div>
        <List>
            {data.map(it => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </List>
    </div>*/
    return <div>
        <Typography gutterBottom variant="h4">
            Library - Recent items
        </Typography>
        <InfiniteScroll
            dataLength={loadedItems.length} //This is important field to render the next data
            next={nextGroup}
            scrollableTarget={"workspaceContainer"+id}
            hasMore={true}
            loader={<h4>Loading...</h4>}
            endMessage={
                <p style={{ textAlign: 'center' }}>
                <b>Yay! You have seen it all</b>
                </p>
            }
        >
            {buildGraph(loadedItems || []).map((it: any) => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </InfiniteScroll>
    </div>
}

export default UserLibraryAll;