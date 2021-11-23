import { Button, FormControl, InputLabel, List, ListItem, MenuItem, Select, Tab, Tabs, TextField } from '@material-ui/core';
import { TabPanel } from './TabPanel';
import React from 'react';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';

export const NewUserCode = ({}) => {
    const [displayName, setDisplayName] = React.useState("");
    const [env, setEnv] = React.useState("");

    return <div style={{display: "flex", alignItems: "baseline"}}>
        <TextField label="Display name" value={displayName} onChange={(ev) => setDisplayName(ev.target.value)}>Display Name</TextField>
        <FormControl>
            <InputLabel>Select env</InputLabel>
            <Select label="Env" value={env} onChange={(ev) => setEnv(ev.target.value as string)}>
                <MenuItem value="">Select environment</MenuItem>
                <MenuItem value="routine/js">routine/js</MenuItem>
                <MenuItem value="component/react-jsx">component/react-jsx</MenuItem>
                <MenuItem value="lambda/js">lambda/js</MenuItem>
                <MenuItem value="client/js">client/js</MenuItem>
            </Select>
        </FormControl>
        
        <Button onClick={() => {
            window.unigraph.addObject({
                editable: true,
                env: env,
                name: displayName,
                src: ""
            }, "$/schema/executable")
        }}>Create</Button>
    </div>
}

export const CodeEditor = ({id}: any) => {

    const [execcontent, setexecContent]: any = React.useState([]);
    const [userExecContent, setUserExecContent]: any = React.useState([]);
    const [currentUid, setCurrentUid]: any = React.useState("");

    const [currentTab, setCurrentTab]: any = React.useState(0);

    const currentView = <DetailedObjectView uid={currentUid} id={id} component={{"$/schema/executable": {view: ExecutableCodeEditor}}} />


    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToType("$/schema/executable", (execs: any[]) => {
            let namedEx: any[] = [], userEx: any[] = [];
            execs.forEach(el => {
                if (typeof el['unigraph.id'] === "string") namedEx.push(el);
                else userEx.push(el);
            });
            setexecContent(namedEx);
            setUserExecContent(userEx);
        }, id)

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <SplitterLayout primaryIndex={1} secondaryInitialSize={360}>
        <div>
            <Tabs value={currentTab} onChange={(ev, newTab) => {setCurrentTab(newTab)}} aria-label="simple tabs example"
                style={{position: "fixed", height: "48px", backgroundColor: "white", zIndex: 999}}
            >
                <Tab label="Packaged code" />
                <Tab label="User code" />
            </Tabs>
            <div style={{minHeight: "48px"}}></div>
            <TabPanel value={currentTab} index={0}>
                <List style={{overflow: "auto"}}>
                    {execcontent.map((it: any) => <ListItem key={it.uid} selected={currentUid === it.uid} onClick={() => {setCurrentUid(it.uid)}}>
                        <AutoDynamicView object={it} />
                    </ListItem>)}
                </List>
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
                <NewUserCode />
                <List style={{overflow: "auto"}}>
                    {userExecContent.map((it: any) => <ListItem key={it.uid} selected={currentUid === it.uid} onClick={() => {setCurrentUid(it.uid)}}>
                        <AutoDynamicView object={it} />
                    </ListItem>)}
                </List>
            </TabPanel>
        </div>
        <div>{currentUid ? currentView : ""}</div>
    </SplitterLayout>
}