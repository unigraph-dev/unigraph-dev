import { Button, Collapse, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Select, Tab, Tabs, TextField } from '@material-ui/core';
import { TabPanel } from './TabPanel';
import React from 'react';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import _ from 'lodash';

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
    const [execPackages, setExecPackages]: any = React.useState([]);
    const [currentUid, setCurrentUid]: any = React.useState("");

    const [currentTab, setCurrentTab]: any = React.useState(0);

    const currentView = <DetailedObjectView uid={currentUid} id={id} component={{"$/schema/executable": {view: ExecutableCodeEditor}}} callbacks={{isEmbed: true}} />

    const [isUserCollapseOpen, setIsUserCollapseOpen] = React.useState(false);
    const [currentPackage, setCurrentPackage] = React.useState('');

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
            const packages = _.uniq(namedEx.map(el => el['unigraph.id'].split('/').slice(0, 3).join('/'))).sort();
            setExecPackages(packages);
        }, id)

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })

    return <SplitterLayout primaryIndex={1} secondaryInitialSize={360}>
        <div>
            {/* User code */}
            <ListItem onClick={() => {setIsUserCollapseOpen(!isUserCollapseOpen)}} style={{cursor: "pointer"}}>
                <ListItemText primary="User code" />
                {isUserCollapseOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={isUserCollapseOpen}>
                <NewUserCode />
                <List style={{overflow: "auto"}}>
                    {userExecContent.map((it: any) => <ListItem key={it.uid} selected={currentUid === it.uid} onClick={() => {setCurrentUid(it.uid)}}>
                        <AutoDynamicView object={it} />
                    </ListItem>)}
                </List>
            </Collapse>
            
            {execPackages.map((el: string) => <React.Fragment>
                <ListItem onClick={() => {setCurrentPackage(currentPackage === el ? "" : el)}} style={{cursor: "pointer"}}>
                    <ListItemText primary={el} />
                    {currentPackage === el ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={currentPackage === el}>
                    <List style={{overflow: "auto"}}>
                        {execcontent.filter((it: any) => it['unigraph.id']?.startsWith(el)).map((it: any) => <ListItem key={it.uid} selected={currentUid === it.uid} onClick={() => {setCurrentUid(it.uid)}}>
                            <AutoDynamicView object={it} />
                        </ListItem>)}
                    </List>
                </Collapse>
            </React.Fragment>)}
        </div>
        <div>{currentUid ? currentView : ""}</div>
    </SplitterLayout>
}