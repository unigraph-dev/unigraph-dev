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
import { motion } from 'framer-motion';

import * as mmonaco from 'monaco-editor';
import {
    BarsArrowUpIcon,
    BarsArrowDownIcon,
    CheckIcon,
    PlayIcon,
    ViewColumnsIcon,
    ArrowRightIcon,
    CircleStackIcon,
    CodeBracketIcon,
    EyeIcon,
    FolderIcon,
} from '@heroicons/react/24/outline';
import { hoverSx, isMobile, isSmallScreen, pointerHoverSx, TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';
import { Button } from '../lib/Button';
import { SchemaDefn, TypeView } from './TypeEditor';

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

function ExecSidebar({ id, currentUid, setCurrentUid, setCurrentType, sidebarCollapsed, setSidebarCollapsed }: any) {
    const [execcontent, setexecContent]: any = React.useState([]);
    const [userExecContent, setUserExecContent]: any = React.useState([]);
    const [typecontent, settypeContent]: any = React.useState([]);
    const [userTypeContent, setUserTypeContent]: any = React.useState([]);
    const [execPackages, setExecPackages]: any = React.useState([]);
    const [packages, setPackages]: any = React.useState([]);
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
                setExecPackages((old: any[]) => _.uniq([...old, ...pkgs]));
            },
            subsId,
        );

        tabContext.subscribeToQuery(
            `(func: type(Type)) @recurse { uid <unigraph.id> <_definition> expand(_userpredicate_) }`,
            (execs: any[]) => {
                const namedEx: any[] = [];
                const userEx: any[] = [];
                execs.forEach((el) => {
                    if (typeof el['unigraph.id'] === 'string' && !el['unigraph.id'].startsWith('$/package/local/'))
                        namedEx.push(el);
                    else userEx.push(el);
                });
                settypeContent(namedEx);
                setUserTypeContent(userEx);
                const pkgs = _.uniq(namedEx.map((el) => el['unigraph.id'].split('/').slice(0, 3).join('/'))).sort();
                setExecPackages((old: any[]) => _.uniq([...old, ...pkgs.filter((el) => el.startsWith('$/package/'))]));
            },
            subsId + 1,
            { noExpand: true },
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
            tabContext.unsubscribe(subsId + 1);
        };
    });

    return (
        <>
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
                    <div className="text-[13px] ml-4 mb-1 mt-2 font-semibold text-gray-400 flex items-center">
                        Executables
                    </div>
                    {userExecContent.map((it: any) => (
                        <ListItem sx={pointerHoverSx} key={it.uid} selected={currentUid === it.uid}>
                            <AutoDynamicView
                                object={it}
                                onClick={() => {
                                    setCurrentUid(it.uid);
                                    setCurrentType('code');
                                    if (isSmallScreen()) setSidebarCollapsed(true);
                                }}
                            />
                        </ListItem>
                    ))}
                    <div className="text-[13px] ml-4 mb-1 mt-2 font-semibold text-gray-400 flex items-center">
                        Types
                    </div>
                    {userTypeContent.map((it: any) => (
                        <ListItem
                            sx={pointerHoverSx}
                            key={it.uid}
                            selected={currentUid === it.uid}
                            onClick={() => {
                                setCurrentUid(it.uid);
                                setCurrentType('type');
                                if (isSmallScreen()) setSidebarCollapsed(true);
                            }}
                        >
                            <SchemaDefn it={it} />
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
                            <Icon path={mdiPackageVariantClosed} size={0.8} className="text-slate-600" />
                            <div className="flex flex-col ml-4">
                                <span className="text-sm text-slate-800 font-medium">
                                    {packages
                                        .find(
                                            (pkg: UnigraphObject) =>
                                                `$/package/${pkg.get('package_name').as('primitive')}` === el,
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
                            <div className="text-[13px] ml-4 mb-1 mt-2 font-semibold text-gray-400 flex items-center">
                                Executables
                            </div>
                            {execcontent
                                .filter((it: any) => it['unigraph.id']?.startsWith(`${el}/`))
                                .map((it: any) => (
                                    <ListItem sx={pointerHoverSx} key={it.uid} selected={currentUid === it.uid}>
                                        <AutoDynamicView
                                            object={it}
                                            onClick={() => {
                                                setCurrentUid(it.uid);
                                                setCurrentType('code');
                                                if (isSmallScreen()) setSidebarCollapsed(true);
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            <div className="text-[13px] ml-4 mb-1 mt-2 font-semibold text-gray-400 flex items-center">
                                Types
                            </div>
                            {typecontent
                                .filter((it: any) => it['unigraph.id']?.startsWith(`${el}/`))
                                .map((it: any) => (
                                    <ListItem
                                        sx={pointerHoverSx}
                                        key={it.uid}
                                        selected={currentUid === it.uid}
                                        onClick={() => {
                                            setCurrentUid(it.uid);
                                            setCurrentType('type');
                                            if (isSmallScreen()) setSidebarCollapsed(true);
                                        }}
                                    >
                                        <SchemaDefn it={it} />
                                    </ListItem>
                                ))}
                        </List>
                    </Collapse>
                </>
            ))}
        </>
    );
}

function ExecView({
    id,
    currentUid,
    sidebarCollapsed,
    setSidebarCollapsed,
    runnerCollapsed,
    setRunnerCollapsed,
    runExecutableHandler,
}: any) {
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

    return (
        <>
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
        </>
    );
}

const tabs = [
    { id: 'code', label: 'Packages', icon: FolderIcon, sidebar: ExecSidebar },
    { id: 'view', label: 'View', icon: EyeIcon, sidebar: ExecSidebar },
];

function AnimatedTabs({ activeTab, setActiveTab }: any) {
    return (
        <div className="flex space-x-1 bg-slate-200/60 backdrop-blur-sm p-1" style={{ borderRadius: 9999 }}>
            {tabs.map((tab) => (
                <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                        activeTab === tab.id ? '' : 'hover:text-slate-700/60'
                    } relative rounded-full px-3.5 py-1 text-[12px] font-medium text-slate-700 outline-sky-400 transition focus-visible:outline-2 flex items-center`}
                    style={{
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="bubble"
                            className="absolute inset-0 z-10 bg-slate-300/70 mix-blend-darken"
                            style={{ borderRadius: 9999 }}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <tab.icon className="mr-1.5 h-[14px] w-[14px]" />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export function CodeEditor({ id }: any) {
    const [activeTab, setActiveTab] = React.useState(tabs[0].id);
    const [currentUid, setCurrentUid]: any = React.useState('');
    const [currentType, setCurrentType]: any = React.useState('');

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
                            className={`overflow-x-hidden flex-shrink-0 min-w-[340px] max-w-[340px] h-full relative ${
                                sidebarCollapsed ? ' hidden' : ''
                            }`}
                        >
                            <div
                                className="pt-3 pb-1 z-10 absolute bottom-0 flex flex-col items-center w-full backdrop-blur-sm bg-white/40"
                                style={{
                                    WebkitMaskImage:
                                        'linear-gradient(to top,black 60%, #ffffff70 90%, transparent 100%)',
                                    maskImage: 'linear-gradient(to top,black 60%, #ffffff70 90%, transparent 100%)',
                                }}
                            >
                                <AnimatedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                            </div>
                            <div
                                className="h-full no-scroll overflow-y-auto overflow-x-visible transition-transform w-fit"
                                style={{
                                    transform: `translateX(${-340 * tabs.findIndex((el) => el.id === activeTab)}px)`,
                                }}
                            >
                                <div className="mb-12 overflow-x-visible flex w-fit">
                                    {tabs.map((el, idx) => (
                                        <div className="flex-shrink-0 min-w-[340px] max-w-[340px]">
                                            <el.sidebar
                                                id={id}
                                                key={el.id}
                                                currentUid={currentUid}
                                                setCurrentUid={setCurrentUid}
                                                setCurrentType={setCurrentType}
                                                sidebarCollapsed={sidebarCollapsed}
                                                setSidebarCollapsed={setSidebarCollapsed}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {!sidebarCollapsed && <Divider flexItem orientation="vertical" />}
                        <div className="h-full" style={{ width: sidebarCollapsed ? '100%' : 'calc(100% - 341px)' }}>
                            {currentType === 'code' && (
                                <ExecView
                                    id={id}
                                    currentUid={currentUid}
                                    sidebarCollapsed={sidebarCollapsed}
                                    setSidebarCollapsed={setSidebarCollapsed}
                                    runnerCollapsed={runnerCollapsed}
                                    setRunnerCollapsed={setRunnerCollapsed}
                                    runExecutableHandler={runExecutableHandler}
                                />
                            )}
                            {currentType === 'type' && <TypeView uid={currentUid} />}
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
