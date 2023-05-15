/* eslint-disable new-cap */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-var-requires */
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Editor, { loader } from '@monaco-editor/react';
import React, { useEffect } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { ExpandMore, Save } from '@mui/icons-material';
import { Actions } from 'flexlayout-react';
import { useEffectOnce } from 'react-use';
import { configureMonacoTailwindcss, tailwindcssData } from 'monaco-tailwindcss';

import * as mmonaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import unigraphDecl from 'unigraph-dev-common/lib/types/unigraph.d.ts?raw';
import { ClockIcon, CodeBracketSquareIcon, PlayIcon } from '@heroicons/react/24/outline';
import ReactTimeAgo from 'react-time-ago';
import { mdiPackageVariantClosed } from '@mdi/js';
import Icon from '@mdi/react';
import tailwindcssWorker from './tailwindcss.worker.js?worker';

// eslint-disable-next-line no-restricted-globals
self.MonacoEnvironment = {
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
        if (label === 'tailwindcss') {
            console.log('uewiruewiurfioewuroieoruewio');
            return new tailwindcssWorker();
        }
        return new editorWorker();
    },
};

loader.config({ monaco: mmonaco });

const beginStr = '/** Unigraph interface */';
const endStr = '/** End of unigraph interface */';
let decl = unigraphDecl.substring(
    unigraphDecl.lastIndexOf(beginStr) + beginStr.length,
    unigraphDecl.lastIndexOf(endStr),
);
decl = decl.replace(/export declare type /g, 'declare type ');
decl = decl.replace(/export type /g, 'declare type ');
decl = decl.replace(/export interface /g, 'declare interface ');
decl +=
    '\ndeclare var unigraph: Unigraph<WebSocket>; declare const unpad = (a:any) => any; declare const require = (a:any) => any;\ndeclare var context = {params: any}';

function AddImportComponent({ onAddImport }: any) {
    const [pkgName, setPkgName] = React.useState('');
    const [impt, setImpt] = React.useState('');
    const [imptas, setImptas] = React.useState('');
    const [env, setEnv] = React.useState('');

    return (
        <>
            <FormControl>
                <InputLabel>Select env</InputLabel>
                <Select label="Env" value={env} onChange={(ev) => setEnv(ev.target.value as string)}>
                    <MenuItem value="">Env</MenuItem>
                    <MenuItem value="npm">npm</MenuItem>
                    <MenuItem value="unigraph">unigraph</MenuItem>
                </Select>
            </FormControl>
            <TextField label="Package name" value={pkgName} onChange={(ev) => setPkgName(ev.target.value)}>
                Pkg Name
            </TextField>
            <TextField label="Import" value={impt} onChange={(ev) => setImpt(ev.target.value)}>
                Import
            </TextField>
            <TextField label="As" value={imptas} onChange={(ev) => setImptas(ev.target.value)}>
                As
            </TextField>

            <Button
                onClick={() => {
                    onAddImport(env, pkgName, impt, imptas);
                }}
            >
                Create
            </Button>
        </>
    );
}

function ImportItem({ data }: any) {
    return (
        <div style={{ display: 'flex' }}>
            <Typography style={{ color: 'gray', marginRight: '0.5em' }}>from</Typography>
            <Typography style={{ marginRight: '0.5em' }}>{data?.env['_value.%']}</Typography>
            <Typography>{data?.package['_value.%']}</Typography>
            <Typography
                style={{
                    color: 'gray',
                    marginRight: '0.5em',
                    marginLeft: '0.5em',
                }}
            >
                import
            </Typography>
            <Typography>{data?.import?.['_value.%'] || '*'}</Typography>
            <Typography
                style={{
                    color: 'gray',
                    marginRight: '0.5em',
                    marginLeft: '0.5em',
                }}
            >
                as
            </Typography>
            <Typography>{data?.import_as['_value.%']}</Typography>
        </div>
    );
}

const lang: any = {
    'component/react-jsx': 'javascript',
    'routine/js': 'javascript',
    'lambda/js': 'javascript',
    'client/js': 'javascript',
    'client-startup/js': 'javascript',
    'backend-startup/js': 'javascript',
    'client/css': 'css',
};

const ext: any = {
    'component/react-jsx': '.jsx',
    'routine/js': '.js',
    'lambda/js': '.js',
    'client/js': '.js',
    'client-startup/js': '.js',
    'backend-startup/js': '.js',
    'client/css': '.css',
};

// const wrapCode = (src: string, env: string) => {
//     if (env === 'routine/js') {
//         return `import { unigraph, unpad, require } from 'unigraph-dev';\n\nfunction runRoutine() { ${src}\n}`
//     }
// }

export function ExecutableCodeEditor({ data, options, callbacks }: any) {
    const unpadded = unpad(data);

    const [currentCode, setCurrentCode] = React.useState(unpadded.src);
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const [previewComponent, setPreviewComponent] = React.useState<any>('');

    const editorRef = React.useRef<any>(null);

    const updateCode = (newSrc: string) => {
        window.unigraph.updateObject(
            data.uid,
            { src: newSrc },
            undefined,
            undefined,
            unpadded.env.endsWith('/react-jsx') ? [99999998, 99999999] : undefined,
        );
    };

    function handleEditorChange(value: any, event: any) {
        setCurrentCode(value);
    }

    useEffect(() => {
        if (callbacks?.actions?.current) {
            callbacks.actions.current.save = () => {
                updateCode(currentCode);
            };
        }
    }, [callbacks, currentCode]);

    useEffectOnce(() => {
        if (options?.viewId) {
            window.layoutModel.doAction(
                Actions.renameTab(
                    options.viewId,
                    `Code: ${unpadded['unigraph.id']?.split('/').slice(-1).join('') || data.uid}`,
                ),
            );
        }
    });

    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            <div style={{ display: 'flex' }}>
                <Accordion
                    expanded={optionsOpen}
                    onChange={() => setOptionsOpen(!optionsOpen)}
                    variant="outlined"
                    style={{ flexGrow: 1, marginBottom: '4px' }}
                    className="border-none"
                >
                    <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1bh-content" id="panel1bh-header">
                        <div className="flex flex-col">
                            <p>
                                <span className="mr-2 inline-flex items-center rounded-full bg-gray-50 px-2 py-[1px] text-xs font-medium text-gray-600 outline outline-1 outline-gray-200">
                                    <PlayIcon className="h-3 w-3 -ml-0.5 mr-1" />
                                    {unpadded.env}
                                </span>
                                <span className="text-[15px] text-gray-800 font-medium">{unpadded.name}</span>
                            </p>
                            <p className="-mt-[1px]">
                                <span className="text-xs text-gray-600">
                                    <ClockIcon className="inline h-[12px] w-[12px] mr-1 mb-0.5" />
                                    <ReactTimeAgo date={new Date(data._updatedAt)} />
                                </span>
                                {data?.['unigraph.id']?.length > 0 && (
                                    <span className="text-xs text-gray-600 ml-3">
                                        <CodeBracketSquareIcon className="inline h-[12px] w-[12px] mr-1" />
                                        <pre className="inline text-[11px]">
                                            $/executable/{data['unigraph.id'].split('/executable/')[1]}
                                        </pre>
                                    </span>
                                )}
                            </p>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List style={{ width: '100%' }}>
                            <ListItem>
                                <Typography
                                    style={{
                                        flexBasis: '33.33%',
                                        flexShrink: 0,
                                        maxWidth: '240px',
                                    }}
                                >
                                    Periodic
                                </Typography>
                                <Typography color="textSecondary">{unpadded.periodic || 'none'}</Typography>
                            </ListItem>
                            <ListItem
                                style={{
                                    display: unpadded.env?.startsWith?.('component') ? '' : 'none',
                                }}
                            >
                                <Button
                                    onClick={() =>
                                        window.unigraph
                                            .runExecutable(unpadded['unigraph.id'] || data.uid, {})
                                            .then((comp: any) => setPreviewComponent(React.createElement(comp, {}, [])))
                                    }
                                >
                                    Preview
                                </Button>
                            </ListItem>
                            <ListItem>
                                <Typography
                                    style={{
                                        flexBasis: '33.33%',
                                        flexShrink: 0,
                                        maxWidth: '240px',
                                    }}
                                >
                                    Imports
                                </Typography>
                                <List>
                                    {(data?._value?.imports?.['_value['] || []).map((el: any) => (
                                        <ListItem>
                                            <ImportItem data={el._value} />
                                        </ListItem>
                                    ))}
                                    <ListItem>
                                        <AddImportComponent
                                            onAddImport={(env: string, pkg: string, impt: string, imptAs: string) => {
                                                window.unigraph.updateObject(data.uid, {
                                                    imports: [
                                                        {
                                                            env,
                                                            package: pkg,
                                                            import: impt,
                                                            import_as: imptAs,
                                                        },
                                                    ],
                                                });
                                            }}
                                        />
                                    </ListItem>
                                </List>
                            </ListItem>
                        </List>
                        {previewComponent}
                    </AccordionDetails>
                </Accordion>
                {/* callbacks.isEmbed !== true && (
                    <IconButton onClick={() => updateCode(currentCode)} size="large">
                        <Save />
                    </IconButton>
                ) */}
            </div>
            <div style={{ flexGrow: 1, height: '100%' }}>
                <Editor
                    defaultLanguage={lang[unpadded.env]}
                    beforeMount={(monaco) => {
                        // monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

                        monaco.languages.css.cssDefaults.setOptions({
                            data: {
                                dataProviders: {
                                    tailwindcssData,
                                },
                            },
                        });

                        if (!window.twFlag) {
                            configureMonacoTailwindcss(monaco);
                            window.twFlag = true;
                        }

                        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                            noSemanticValidation: false,
                            noSyntaxValidation: false,
                            // Disable error codes: allow return value; no top level await *2; check for typescript annotation
                            diagnosticCodesToIgnore: [1108, 1375, 1378, 7044],
                        });

                        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                            target: monaco.languages.typescript.ScriptTarget.ES2016,
                            allowNonTsExtensions: true,
                            allowJs: true,
                        });

                        monaco.languages.typescript.javascriptDefaults.addExtraLib(decl, 'file:///index.d.ts');
                        (data._value.imports?.['_value['] || []).forEach((el: any) => {
                            if (el._value.env['_value.%'] === 'npm') {
                                // TODO: import references
                            }
                        });
                        // throw new Error('Not implemented');
                    }}
                    onMount={(editor, monaco) => {
                        editorRef.current = editor;
                    }}
                    path={`file:///${data.uid || 'main'}${ext[unpadded.env]}`}
                    defaultValue={currentCode}
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={handleEditorChange}
                />
            </div>
        </div>
    );
}
