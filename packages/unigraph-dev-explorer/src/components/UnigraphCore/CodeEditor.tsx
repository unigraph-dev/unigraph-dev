/* eslint-disable new-cap */
import {
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
import {
    BarsArrowUpIcon,
    BarsArrowDownIcon,
    CheckIcon,
    PlayIcon,
    ViewColumnsIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { hoverSx, pointerHoverSx, TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';
import { Button } from '../lib/Button';

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

export function CodeEditor({ id }: any) {
    const [execcontent, setexecContent]: any = React.useState([]);
    const [userExecContent, setUserExecContent]: any = React.useState([]);
    const [execPackages, setExecPackages]: any = React.useState([]);
    const [packages, setPackages]: any = React.useState([]);
    const [currentUid, setCurrentUid]: any = React.useState('');

    const actionsRef = React.useRef<any>({});
    const currentView = React.useMemo(
        () => (
            <DetailedObjectView
                uid={currentUid}
                id={id}
                components={{
                    '$/schema/executable': { view: ExecutableCodeEditor },
                }}
                callbacks={{ isEmbed: true, actions: actionsRef }}
            />
        ),
        [currentUid, id],
    );

    const [isUserCollapseOpen, setIsUserCollapseOpen] = React.useState(false);
    const [currentPackage, setCurrentPackage] = React.useState('');

    const [json, setJson] = React.useState('');
    const [response, setResponse] = React.useState("Press 'Run' to see results");

    const runExecutableHandler = React.useCallback(() => {
        if (currentUid)
            window.unigraph
                .runExecutable(
                    currentUid,
                    isJsonString(json) ? JSON.parse(json) : undefined,
                    { showConsole: true },
                    true,
                )
                .then((res) => {
                    setResponse(JSON.stringify(res, null, 2));
                });
    }, [currentUid, json]);

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

    const [runnerCollapsed, setRunnerCollapsed] = React.useState(true);
    const bigSplitterRef = React.useRef<any>(null);
    React.useEffect(() => {
        bigSplitterRef?.current.setState({ secondaryPaneSize: runnerCollapsed ? 0 : 360 });
    }, [runnerCollapsed]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexGrow: 1 }}>
                <SplitterLayout vertical secondaryInitialSize={0} ref={bigSplitterRef}>
                    <div className="flex h-full overflow-hidden">
                        <div
                            className={`flex-shrink-0 max-w-[340px] h-full overflow-y-auto${
                                sidebarCollapsed ? ' hidden' : ''
                            }`}
                        >
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
                        {!sidebarCollapsed && <Divider flexItem orientation="vertical" />}
                        <div className="h-full" style={{ width: sidebarCollapsed ? '100%' : 'calc(100% - 341px)' }}>
                            <div className="h-full">{currentUid ? currentView : ''}</div>
                            <div className="h-10 flex gap-2 px-2 py-1 absolute bottom-0 right-0 bg-transparent">
                                <Button onClick={(ev) => setSidebarCollapsed(!sidebarCollapsed)}>
                                    <ViewColumnsIcon className="h-4 w-4" />
                                    Sidebar
                                </Button>
                                <Button
                                    onClick={(ev) => {
                                        setRunnerCollapsed(!runnerCollapsed);
                                        // if (runnerCollapsed) setSidebarCollapsed(true);
                                    }}
                                >
                                    {runnerCollapsed ? (
                                        <BarsArrowUpIcon className="h-4 w-4" />
                                    ) : (
                                        <BarsArrowDownIcon className="h-4 w-4" />
                                    )}
                                    Runner
                                </Button>
                                {currentUid.length > 0 && (
                                    <>
                                        <Button
                                            onClick={() => {
                                                actionsRef.current.save();
                                            }}
                                        >
                                            <CheckIcon className="h-4 w-4" />
                                            Save
                                        </Button>
                                        <Button onClick={runExecutableHandler}>
                                            <PlayIcon className="h-4 w-4" />
                                            Run
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <div style={{ flexGrow: 1, height: '100%', width: '50%' }}>
                            <Editor
                                defaultLanguage="json"
                                path="params.json"
                                value={json}
                                onChange={setJson as any}
                                className="my-2"
                            />
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-slate-500" />
                        <div
                            style={{ flexGrow: 1, height: 'calc(100% - 16px)', width: '50%' }}
                            className="ml-4 mx-2 px-3 py-2 bg-gray-50 ring-1 ring-gray-200 rounded-lg overflow-auto"
                        >
                            <pre className="text-sm ">{response}</pre>
                        </div>
                    </div>
                </SplitterLayout>
                <div className="h-1 absolute bottom-0 w-full bg-white" />
            </div>
        </div>
    );
}
