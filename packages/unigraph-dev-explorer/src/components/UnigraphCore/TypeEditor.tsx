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
import { getCircularReplacer, isJsonString, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
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
    CircleStackIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import stringify from 'json-stable-stringify';
import { hoverSx, isMobile, isSmallScreen, pointerHoverSx, TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import DetailedObjectView from '../UserLibrary/UserLibraryObject';
import { ExecutableCodeEditor } from '../ObjectView/DefaultCodeEditor';
import { Button } from '../lib/Button';

loader.config({ monaco: mmonaco });

export function NewUserCode({}) {
    const [displayName, setDisplayName] = React.useState('');
    const [slug, setSlug] = React.useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'baseline' }}>
            <TextField label="Display name" value={displayName} onChange={(ev) => setDisplayName(ev.target.value)}>
                Display Name
            </TextField>
            <TextField label="Slug" value={slug} onChange={(ev) => setSlug(ev.target.value)}>
                Slug
            </TextField>

            <Button
                onClick={() => {
                    window.unigraph.createSchema({
                        'unigraph.id': `$/package/local/0.0.0/schema/${slug}`,
                        'dgraph.type': 'Type',
                        _name: displayName,
                    });
                }}
            >
                Create
            </Button>
        </div>
    );
}

function getTypeCodegenPrompt(req: string) {
    return [
        {
            role: 'system',
            content: `You are an AI language model created on the personal operating system called Unigraph. You are tasked to create type schemas based on the user's request. Some examples of schemas might include: books in a reading list, trips taken, performances seen, etc.

Instructions:
- use "$/primitive/string" for plain text only, use "$/schema/interface/textual" for rich text
- if needed, enforce uniqueness by using \`"_unique": true\`
- include at least one field with \`"_indexAs": "name"\` to make sure that it's searchable

Here's an example schema definition, based on the request "color-coded tags with a name, description, and children":

\`\`\`
{
    "dgraph.type": "Type",
    "_name": "Tag",
    "_definition": {
        "type": { "unigraph.id": "$/composer/Object" },
        "_parameters": {
            "_indexedBy": { "unigraph.id": "$/primitive/string" }
        },
        "_properties": [
            {
                "_key": "name",
                "_definition": {
                    "type": { "unigraph.id": "$/primitive/string" }
                },
                "_unique": true,
                "_indexAs": "name"
            },
            {
                "_key": "description",
                "_definition": {
                    "type": { "unigraph.id": "$/schema/interface/textual" }
                }
            },
            {
                "_key": "color",
                "_definition": {
                    "type": { "unigraph.id": "$/schema/color" }
                }
            },
            {
                "_key": "children",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/composer/Array"
                    },
                    "_parameters": {
                        "_element": {
                            "type": { "unigraph.id": "$/composer/Union" },
                            "_parameters": {
                                "_definitions": [
                                    {
                                        "type": { "unigraph.id": "$/schema/subentity" }
                                    },
                                    {
                                        "type": { "unigraph.id": "$/schema/interface/semantic" }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]
    }
}
\`\`\``,
        },
        { role: 'user', content: req },
        { role: 'assistant', content: '```' },
    ];
}

function getReadableSchemaDefn(schema: any) {
    function recurse(obj: any) {
        // 1. Remove all uid's
        if (obj.uid) delete obj.uid;
        // 2. Remove all schema references
        if (obj !== schema && obj?.['unigraph.id'] && obj['unigraph.id']?.startsWith('$/schema/')) {
            for (const key in obj) {
                if (key !== 'unigraph.id') delete obj[key];
            }
        }

        for (const key in obj) {
            if (typeof obj[key] === 'object') {
                recurse(obj[key]);
            }
        }
    }

    recurse(schema);
    schema['dgraph.type'] = 'Type';
    return schema;
}

export function TypeView({ uid }: any) {
    const [defn, setDefn] = React.useState('');
    const [editedDefn, setEditedDefn] = React.useState('');
    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const subsId = getRandomInt();

        tabContext.subscribeToQuery(
            `(func: uid(${uid})) @recurse { uid <unigraph.id> <_definition> expand(_userpredicate_) }`,
            (obj: any) => {
                setDefn(
                    JSON.stringify(
                        getReadableSchemaDefn(JSON.parse(stringify(obj[0], { replacer: getCircularReplacer() }))),
                        null,
                        4,
                    ),
                );
            },
            subsId,
            { noExpand: true },
        );

        return () => {
            tabContext.unsubscribe(subsId);
        };
    }, [uid]);

    React.useEffect(() => {
        if (defn) setEditedDefn(defn);
    }, [defn]);

    const [codegenQuery, setCodegenQuery] = React.useState('');
    const [codegenResult, setCodegenResult] = React.useState('');
    const [codegenCompleted, setCodegenCompleted] = React.useState(false);

    const handleCodegen = async () => {
        setCodegenCompleted(false);
        const it = await window.unigraph.runExecutableStreamed!(
            '$/executable/lm-gpt3',
            {
                messages: getTypeCodegenPrompt(codegenQuery),
                stream: true,
                max_tokens: 1024,
                stop: '```',
            },
            (res: any) => setCodegenResult((prev) => prev + res),
        );
        setCodegenCompleted(true);
    };

    const addChildren = async () => {
        if (!isJsonString(editedDefn)) return;
        const defnObj = JSON.parse(editedDefn);
        defnObj._definition._properties.push({
            _key: 'children',
            _definition: {
                type: {
                    'unigraph.id': '$/composer/Array',
                },
                _parameters: {
                    _element: {
                        type: { 'unigraph.id': '$/composer/Union' },
                        _parameters: {
                            _definitions: [
                                {
                                    type: { 'unigraph.id': '$/schema/subentity' },
                                },
                                {
                                    type: { 'unigraph.id': '$/schema/interface/semantic' },
                                },
                            ],
                        },
                    },
                },
            },
        });
        setEditedDefn(JSON.stringify(defnObj, null, 4));
    };

    React.useEffect(() => {
        if (codegenCompleted && isJsonString(codegenResult)) {
            const resultObj = JSON.parse(codegenResult);
            resultObj['unigraph.id'] = JSON.parse(defn)['unigraph.id'];
            setEditedDefn(JSON.stringify(resultObj, null, 4));
            setCodegenResult('');
            setCodegenCompleted(false);
        } else if (codegenCompleted) {
            setCodegenResult('');
            setCodegenCompleted(false);
        }
    }, [codegenResult, codegenCompleted]);

    return (
        <div className="h-full w-full flex flex-col">
            <div style={{ height: 'calc(100% - 64px)' }} className="relative">
                <Editor
                    defaultLanguage="json"
                    path={`${uid}.json`}
                    value={codegenResult.length > 0 ? codegenResult : editedDefn}
                    onChange={setEditedDefn as any}
                />
                <div className="h-10 flex gap-2 px-2 py-1 absolute bottom-2 right-0 bg-transparent">
                    <Button
                        onClick={() => {
                            addChildren();
                        }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add children field
                    </Button>
                    <Button
                        onClick={() => {
                            window.unigraph.createSchema(JSON.parse(editedDefn));
                        }}
                    >
                        <CheckIcon className="h-4 w-4" />
                        Save
                    </Button>
                </div>
            </div>
            <Divider />
            <div className="h-16 flex items-center">
                <div className="flex-grow mx-3 flex rounded-md shadow-sm">
                    <div className="relative flex flex-grow items-stretch focus-within:z-10">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <SparklesIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="search"
                            name="search"
                            id="text"
                            className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder={'try "color-coded tags with a name and description"'}
                            value={codegenQuery}
                            onChange={(ev) => setCodegenQuery(ev.target.value)}
                            onKeyDown={async (e) => {
                                if (e.keyCode === 13) {
                                    handleCodegen();
                                }
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-medium text-gray-800 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={async () => {
                            handleCodegen();
                        }}
                    >
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SchemaDefn({ it }: any) {
    return (
        <div className="flex gap-4 items-center">
            <p className="bg-indigo-50 p-2 rounded">
                {it._icon && (
                    <div
                        style={{
                            minHeight: '18px',
                            minWidth: '18px',
                            height: '18px',
                            width: '18px',
                            alignSelf: 'center',
                            opacity: 0.64,
                            backgroundImage: `url("data:image/svg+xml,${it._icon}")`,
                        }}
                    />
                )}
                {!it._icon && <div className="h-[18px] w-[18px] text-gray-500" />}
            </p>
            <div>
                <p className="text-sm font-medium">
                    {it?.['unigraph.id']?.split('/schema/')[1]?.startsWith('interface/') && (
                        <pre className="mr-1 text-xs text-indigo-800 p-[2px] px-[6px] rounded inline bg-gray-100 ">
                            I
                        </pre>
                    )}
                    {it._name}
                </p>
                <pre className="text-xs mt-[2px] text-slate-600">
                    $/schema/{it?.['unigraph.id']?.split('/schema/')[1]}
                </pre>
            </div>
        </div>
    );
}
