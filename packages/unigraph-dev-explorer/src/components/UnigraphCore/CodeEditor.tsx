/* eslint-disable new-cap */
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
import { isJsonString, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { mdiPackage, mdiPackageVariantClosed } from '@mdi/js';
import Icon from '@mdi/react';

import * as mmonaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { hoverSx, pointerHoverSx, TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';

// eslint-disable-next-line no-restricted-globals
self.MonacoEnvironment = {
    // eslint-disable-next-line no-shadow
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

loader.config({ monaco: mmonaco });

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
                    <MenuItem value="client-startup/js">client-startup/js</MenuItem>
                    <MenuItem value="client/css">client/css</MenuItem>
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
                <pre style={{ flexGrow: 1, overflow: 'hidden', overflowWrap: 'break-word' }}>
                    context: JSON object accessible from the code
                </pre>
                <Editor defaultLanguage="json" path="params.json" value={json} onChange={setJson as any} />
            </div>
            <Button onClick={runExecutableHandler}>Go</Button>
            <pre style={{ flexGrow: 1, height: '90%', width: 'calc(50% - 32px)' }}>{response}</pre>
        </div>
    );
};

export function CodeEditor({ id }: any) {
    const [execcontent, setexecContent]: any = React.useState([]);
    const [userExecContent, setUserExecContent]: any = React.useState([]);
    const [execPackages, setExecPackages]: any = React.useState([]);
    const [packages, setPackages]: any = React.useState([]);
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
                const pkgs = _.uniq(namedEx.map((el) => el['unigraph.id'].split('/').slice(0, 3).join('/'))).sort();
                setExecPackages(pkgs);
            },
            subsId,
        );

        tabContext.subscribeToType(
            '$/schema/package_manifest',
            (pkgs: any[]) => {
                setPackages(pkgs);
            },
            id,
            { showHidden: true },
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
                <SplitterLayout vertical secondaryInitialSize={0} ref={bigSplitterRef}>
                    <SplitterLayout primaryIndex={1} secondaryInitialSize={360} ref={splitterRef}>
                        <div>
                            {/* User code */}
                            <ListItem
                                onClick={() => {
                                    setIsUserCollapseOpen(!isUserCollapseOpen);
                                }}
                                style={pointerHoverSx}
                            >
                                <ListItemText primary="User code" />
                                {isUserCollapseOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItem>
                            <Collapse in={isUserCollapseOpen}>
                                <NewUserCode />
                                <List style={{ overflow: 'auto' }}>
                                    {userExecContent.map((it: any) => (
                                        <ListItem sx={pointerHoverSx} key={it.uid} selected={currentUid === it.uid}>
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
                                            ...pointerHoverSx,
                                        }}
                                    >
                                        <div className="flex-grow flex items-center">
                                            <Icon
                                                path={mdiPackageVariantClosed}
                                                size={0.8}
                                                className="text-slate-600"
                                            />
                                            <div className="flex flex-col ml-4">
                                                <span className="text-sm text-slate-800 font-medium">
                                                    {packages
                                                        .find(
                                                            (pkg: UnigraphObject) =>
                                                                `$/package/${pkg
                                                                    .get('package_name')
                                                                    .as('primitive')}` === el,
                                                        )
                                                        .get('name')
                                                        .as('primitive')}
                                                </span>
                                                <span className="text-[13px] text-slate-600 mt-0.5">{el}</span>
                                            </div>
                                        </div>
                                        {currentPackage === el ? <ExpandLess /> : <ExpandMore />}
                                    </ListItem>
                                    <Collapse in={currentPackage === el}>
                                        <List style={{ overflow: 'auto' }}>
                                            {execcontent
                                                .filter((it: any) => it['unigraph.id']?.startsWith(`${el}/`))
                                                .map((it: any) => (
                                                    <ListItem
                                                        sx={pointerHoverSx}
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
