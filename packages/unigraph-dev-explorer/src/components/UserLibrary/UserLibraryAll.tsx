import { ListItem, Typography } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useEffectOnce } from 'react-use';
import { buildGraph, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import { setupInfiniteScrolling } from '../ObjectView/infiniteScrolling';

const UserLibraryAll = ({id}: any) => {

    const [data, setData] = React.useState<string[]>([]);
    const [loadedItems, setLoadedItems] = React.useState<any[]>([]);
    const [setupProps, setSetupProps] = React.useState<{next: any, cleanup: any} | null>(null);

    useEffectOnce(() => {
        const subsId = getRandomInt();
        window.unigraph.subscribeToType("any", (result: any[]) => {setData(result.map(el => el.uid))}, subsId, {uidsOnly: true, first: -500});

        return function cleanup() { window.unigraph.unsubscribe(subsId); }
    })

    React.useEffect(() => {
        if (setupProps?.cleanup) setupProps.cleanup();
        let newProps: any = undefined;
        if (data.length) {
            newProps = setupInfiniteScrolling(data, 25, (items: any[]) => {
                setLoadedItems(items);
            });
            setSetupProps(newProps);
            newProps.next();
        }

        return function cleanup () { newProps?.cleanup() }
    }, [data])
    

    return <div>
        <Typography gutterBottom variant="h4">
            Library - Recent items
        </Typography>
        <InfiniteScroll
            dataLength={loadedItems.length} //This is important field to render the next data
            next={setupProps?.next || (() => {})}
            scrollableTarget={"workspaceContainer"+id}
            hasMore={loadedItems.length < data.length}
            loader={<h4>Loading...</h4>}
            endMessage={
                <React.Fragment/>
            }
        >
            {buildGraph(loadedItems || []).map((it: any) => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </InfiniteScroll>
    </div>
}

export default UserLibraryAll;