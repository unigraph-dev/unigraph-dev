import {
    Button,
    Collapse,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
} from '@material-ui/core';
import React from 'react';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import _ from 'lodash';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import { TabContext } from '../../utils';

export function NewUserCode({}) {
    const [displayName, setDisplayName] = React.useState('');
    const [env, setEnv] = React.useState('');

    return (
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <TextField label="Display name" value={displayName} onChange={(ev) => setDisplayName(ev.target.value)}>
                Display Name
            </TextField>
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

            <Button
                onClick={() => {
                    window.unigraph.addObject(
                        {
                            editable: true,
                            env,
                            name: displayName,
                            src: '',
                        },
                        '$/schema/executable',
                    );
                }}
            >
                Create
            </Button>
        </div>
    );
}

export function CodeEditor({ id }: any) {
    const [execcontent, setexecContent]: any = React.useState([]);
    const [userExecContent, setUserExecContent]: any = React.useState([]);
    const [execPackages, setExecPackages]: any = React.useState([]);
    const [currentUid, setCurrentUid]: any = React.useState('');

    const [currentTab, setCurrentTab]: any = React.useState(0);

    const currentView = (
        <DetailedObjectView
            uid={currentUid}
            id={id}
            components={{
                '$/schema/executable': { view: ExecutableCodeEditor },
            }}
            callbacks={{ isEmbed: true }}
        />
    );

    const [isUserCollapseOpen, setIsUserCollapseOpen] = React.useState(false);
    const [currentPackage, setCurrentPackage] = React.useState('');

    const tabContext = React.useContext(TabContext);

    useEffectOnce(() => {
        const subsId = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/executable',
            (execs: any[]) => {
                const namedEx: any[] = [];
                const userEx: any[] = [];
                execs.forEach((el) => {
                    if (typeof el['unigraph.id'] === 'string') namedEx.push(el);
                    else userEx.push(el);
                });
                setexecContent(namedEx);
                setUserExecContent(userEx);
                const packages = _.uniq(namedEx.map((el) => el['unigraph.id'].split('/').slice(0, 3).join('/'))).sort();
                setExecPackages(packages);
            },
            subsId,
        );

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    });

    return (
        <SplitterLayout primaryIndex={1} secondaryInitialSize={360}>
            <div>
                {/* User code */}
                <ListItem
                    onClick={() => {
                        setIsUserCollapseOpen(!isUserCollapseOpen);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <ListItemText primary="User code" />
                    {isUserCollapseOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={isUserCollapseOpen}>
                    <NewUserCode />
                    <List style={{ overflow: 'auto' }}>
                        {userExecContent.map((it: any) => (
                            <ListItem key={it.uid} selected={currentUid === it.uid}>
                                <AutoDynamicView
                                    object={it}
                                    onClick={() => {
                                        setCurrentUid(it.uid);
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Collapse>

                {execPackages.map((el: string) => (
                    <>
                        <ListItem
                            onClick={() => {
                                setCurrentPackage(currentPackage === el ? '' : el);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <ListItemText primary={el} />
                            {currentPackage === el ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={currentPackage === el}>
                            <List style={{ overflow: 'auto' }}>
                                {execcontent
                                    .filter((it: any) => it['unigraph.id']?.startsWith(el))
                                    .map((it: any) => (
                                        <ListItem key={it.uid} selected={currentUid === it.uid}>
                                            <AutoDynamicView
                                                object={it}
                                                onClick={() => {
                                                    setCurrentUid(it.uid);
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                            </List>
                        </Collapse>
                    </>
                ))}
            </div>
            <div>{currentUid ? currentView : ''}</div>
        </SplitterLayout>
    );
}
