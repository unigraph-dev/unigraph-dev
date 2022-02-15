import {
    Button,
    Collapse,
    Divider,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import React from 'react';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import _ from 'lodash';
import Editor, { loader } from '@monaco-editor/react';
import { isJsonString } from 'unigraph-dev-common/lib/utils/utils';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import { hoverSx, TabContext } from '../../utils';

loader.config({ paths: { vs: './vendor/monaco-editor_at_0.31.1/' } });

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

export const Runner = ({ uid }: any) => {
    const [json, setJson] = React.useState('');
    const [response, setResponse] = React.useState("Press 'Go' to see results");

    const runExecutableHandler = React.useCallback(() => {
        if (uid)
            window.unigraph
                .runExecutable(uid, isJsonString(json) ? JSON.parse(json) : undefined, { showConsole: true }, true)
                .then((res) => {
                    setResponse(JSON.stringify(res, null, 2));
                });
    }, [uid, json]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <div style={{ flexGrow: 1, height: '100%', width: 'calc(50% - 32px)' }}>
                <Editor defaultLanguage="json" path="params.json" value={json} onChange={setJson as any} />
            </div>
            <Button onClick={runExecutableHandler}>Go</Button>
            <pre style={{ flexGrow: 1, height: '100%', width: 'calc(50% - 32px)' }}>{response}</pre>
        </div>
    );
};

export function CodeEditor({ id }: any) {
    const [execcontent, setexecContent]: any = React.useState([]);
    const [userExecContent, setUserExecContent]: any = React.useState([]);
    const [execPackages, setExecPackages]: any = React.useState([]);
    const [currentUid, setCurrentUid]: any = React.useState('');

    const currentView = React.useMemo(
        () => (
            <DetailedObjectView
                uid={currentUid}
                id={id}
                components={{
                    '$/schema/executable': { view: ExecutableCodeEditor },
                }}
                callbacks={{ isEmbed: true }}
            />
        ),
        [currentUid, id],
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

    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const splitterRef = React.useRef<any>(null);
    React.useEffect(() => {
        splitterRef?.current.setState({ secondaryPaneSize: sidebarCollapsed ? 0 : 360 });
    }, [sidebarCollapsed]);

    const [runnerCollapsed, setRunnerCollapsed] = React.useState(true);
    const bigSplitterRef = React.useRef<any>(null);
    React.useEffect(() => {
        bigSplitterRef?.current.setState({ secondaryPaneSize: runnerCollapsed ? 0 : 360 });
    }, [runnerCollapsed]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexGrow: 1, height: 'calc(100% - 24px)' }}>
                <SplitterLayout vertical secondaryInitialSize={0} customClassName="bottom-48" ref={bigSplitterRef}>
                    <SplitterLayout primaryIndex={1} secondaryInitialSize={360} ref={splitterRef}>
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
                                        <ListItem sx={hoverSx} key={it.uid} selected={currentUid === it.uid}>
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
                                        sx={{
                                            ...(currentPackage === el ? { backgroundColor: 'action.selected' } : {}),
                                            ...hoverSx,
                                        }}
                                    >
                                        <ListItemText primary={el} />
                                        {currentPackage === el ? <ExpandLess /> : <ExpandMore />}
                                    </ListItem>
                                    <Collapse in={currentPackage === el}>
                                        <List style={{ overflow: 'auto' }}>
                                            {execcontent
                                                .filter((it: any) => it['unigraph.id']?.startsWith(el))
                                                .map((it: any) => (
                                                    <ListItem
                                                        sx={hoverSx}
                                                        key={it.uid}
                                                        selected={currentUid === it.uid}
                                                    >
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
                        {currentUid ? currentView : ''}
                    </SplitterLayout>
                    <Runner uid={currentUid} />
                </SplitterLayout>
            </div>
            <div style={{ height: '48px' }}>
                <Divider />
                <Button variant="outlined" onClick={(ev) => setSidebarCollapsed(!sidebarCollapsed)}>
                    Toggle sidebar
                </Button>
                <Button
                    variant="outlined"
                    onClick={(ev) => {
                        setRunnerCollapsed(!runnerCollapsed);
                        if (runnerCollapsed) setSidebarCollapsed(true);
                    }}
                >
                    Toggle runner
                </Button>
            </div>
        </div>
    );
}
