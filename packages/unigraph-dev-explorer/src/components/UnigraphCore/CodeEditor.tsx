import { List, ListItem } from '@material-ui/core';
import React from 'react';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicView } from '../ObjectView/DefaultObjectView';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';

export const CodeEditor = ({id}: any) => {

    const [execcontent, setexecContent]: any = React.useState([]);
    const [currentUid, setCurrentUid]: any = React.useState("");

    const currentView = <DetailedObjectView uid={currentUid} id={id} />


    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToType("$/schema/executable", (execs: any[]) => {setexecContent(execs)}, id)

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <SplitterLayout primaryIndex={1} secondaryInitialSize={360}>
        <div>
            <List style={{overflow: "auto"}}>
                {execcontent.map((it: any) => <ListItem key={it.uid} onClick={() => {setCurrentUid(it.uid)}}>
                    <AutoDynamicView object={it} />
                </ListItem>)}
            </List>
        </div>
        <div>{currentUid ? currentView : ""}</div>
    </SplitterLayout>
}