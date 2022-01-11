/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/rules-of-hooks */ // Using maps as React functional components
import {
    Button,
    Checkbox,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    makeStyles,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
} from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { SchemaDgraph } from 'unigraph-dev-common/lib/types/json-ts';
import { typeMapUnigraph } from 'unigraph-dev-common/lib/types/consts';
import { KeyboardDateTimePicker } from '@material-ui/pickers';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { Add, Delete, Menu, Save } from '@material-ui/icons';
import { isJsonString, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { ReferenceableSelectorControlled } from '../ObjectView/ReferenceableSelector';
import { BacklinkView } from '../ObjectView/BacklinkView';
import { onUnigraphContextMenu } from '../ObjectView/DefaultObjectContextMenu';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';
import { getDynamicViews } from '../../unigraph-react';
import { TabContext } from '../../utils';

const useStyles = makeStyles({
    editorFrame: {
        padding: '12px',
        margin: '8px',
        borderRadius: '12px',
    },
    editorColumn: {},
});

const defaultNewValues: any = {
    '$/primitive/number': 0,
    '$/primitive/string': '',
    '$/primitive/datetime': new Date().toISOString(),
    '$/primitive/boolean': false,
    '$/composer/Array': [],
    schemaRef: {},
};

const getMetadata = (localObject: any) =>
    Object.entries(localObject)
        .map(([k, v]) => (k.startsWith('_') && !k.startsWith('_value') ? [k, v] : undefined))
        .filter((el) => el !== undefined);
function MetadataDisplay({ metadata }: any) {
    return metadata.length ? (
        <div>
            <Typography>Metadata:</Typography>
            {metadata.map((el: any) => (
                <div style={{ display: 'flex' }}>
                    <Typography style={{ marginRight: '8px' }}>{el[0]}</Typography>
                    <Typography style={{ color: 'gray' }}>{JSON.stringify(el[1])}</Typography>
                </div>
            ))}
        </div>
    ) : (
        <span />
    );
}

const editorHeader = {
    display: 'flex',
    alignItems: 'baseline',
    paddingTop: '8px',
};

const TypedObjectPartEditor: any = {
    '$/composer/Object': ({ localSchema, localObject, schemaMap }: any) => {
        const fields = _.intersection(
            Object.keys(localObject._value),
            localSchema._properties.map((el: any) => el._key),
        );
        const metadata = getMetadata(localObject);
        const classes = useStyles();
        const [selectedNewProp, setSelectedNewProp] = React.useState<any>();
        const [currentInputObjValue, setCurrentInputObjValue] = React.useState<any>();
        const [viewOrEdit, setViewOrEdit] = React.useState<any>(
            getDynamicViews().includes(localObject.type?.['unigraph.id']) ? 'view' : 'edit',
        );
        return (
            <Paper variant="outlined" className={classes.editorFrame}>
                <div style={editorHeader}>
                    <Typography>
                        Object ID:
                        {localObject.uid}, type:
                        {localObject?.type?.['unigraph.id']}
                        <Menu
                            onClick={(event) => onUnigraphContextMenu(event, localObject, undefined)}
                            style={{
                                marginLeft: '8px',
                                marginRight: '8px',
                                alignSelf: 'flex-end',
                            }}
                        />
                    </Typography>
                    {viewOrEdit}
                    <Switch
                        checked={viewOrEdit === 'view'}
                        onChange={() => (viewOrEdit === 'view' ? setViewOrEdit('edit') : setViewOrEdit('view'))}
                    />
                </div>
                <MetadataDisplay metadata={metadata} />
                {viewOrEdit === 'view' ? (
                    <AutoDynamicView object={new UnigraphObject(localObject)} />
                ) : (
                    fields.map((key) => (
                        <div style={editorHeader}>
                            <Typography variant="body1" style={{ paddingRight: '8px' }}>
                                {key}:
                            </Typography>
                            <ObjectPartEditor
                                localSchema={
                                    localSchema._properties.filter((el: any) => el._key === key)[0]._definition
                                }
                                localObject={localObject._value[key]}
                                schemaMap={schemaMap}
                                setLocalObject={(newVal: any) =>
                                    window.unigraph.updateObject(localObject._value[key].uid, newVal, false, false)
                                }
                            />
                            <Delete
                                onClick={() => {
                                    window.unigraph.deleteRelation(localObject._value.uid, { [key]: null });
                                }}
                                className="showOnHover"
                                style={{ alignSelf: 'baseline' }}
                            />
                        </div>
                    ))
                )}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        paddingTop: '8px',
                    }}
                >
                    <FormControl>
                        <InputLabel>New property</InputLabel>
                        <Select
                            value={selectedNewProp}
                            onChange={(e: any) => {
                                setSelectedNewProp(e.target.value);
                                const propType = localSchema._properties.filter(
                                    (el: any) => el._key === e.target.value,
                                )[0]._definition.type['unigraph.id'];
                                let deft;
                                if (
                                    propType.startsWith?.('$/schema') ||
                                    !Object.keys(defaultNewValues).includes(propType)
                                )
                                    deft = defaultNewValues.schemaRef;
                                else deft = defaultNewValues[propType];
                                // console.log(schemaMap[propType])
                                if (
                                    propType.startsWith?.('$/schema') &&
                                    Object.keys(defaultNewValues).includes(
                                        schemaMap[propType]?._definition?.type?.['unigraph.id'],
                                    )
                                )
                                    deft = defaultNewValues[schemaMap[propType]?._definition?.type?.['unigraph.id']];
                                setCurrentInputObjValue(JSON.stringify(deft));
                            }}
                            style={{ width: '240px' }}
                        >
                            <MenuItem>
                                <em>Select property</em>
                            </MenuItem>
                            {localSchema._properties
                                .map((el: any) => el._key)
                                .map((el: string) => (
                                    <MenuItem value={el}>{el}</MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <TextField
                        onChange={(e) => {
                            setCurrentInputObjValue(e.target.value);
                        }}
                        value={currentInputObjValue}
                        style={{
                            opacity: currentInputObjValue === undefined ? 0 : 1,
                        }}
                    />
                    {currentInputObjValue}
                    {!currentInputObjValue || isJsonString(currentInputObjValue) ? '' : ' (not valid)'}
                    <Button
                        onClick={() =>
                            window.unigraph.updateObject(localObject.uid, {
                                [selectedNewProp]: JSON.parse(currentInputObjValue),
                            })
                        }
                        style={{
                            opacity: currentInputObjValue === undefined ? 0 : 1,
                        }}
                    >
                        Add
                    </Button>
                </div>
            </Paper>
        );
    },
    '$/composer/Union': ({ localSchema, localObject, setLocalObject, schemaMap }: any) => {
        if (Object.keys(localObject._value || {}).length === 1 && !localObject._value.type) return 'Deleted object';
        const currentUnionType = localObject._value?.type?.['unigraph.id'] || 'Primitive';
        const classes = useStyles();
        return (
            <Paper variant="outlined" className={classes.editorFrame}>
                <Typography>
                    Union type:
                    {localObject.type?.['unigraph.id'] || 'anonymous union'} - object type:
                    {currentUnionType}
                </Typography>
                <ObjectPartEditor
                    localSchema={
                        schemaMap[currentUnionType]?._definition ||
                        localSchema._parameters?._definitions?.filter((el: any) =>
                            el?.type?.['unigraph.id'].startsWith('$/primitive'),
                        )[0]
                    }
                    localObject={currentUnionType === 'Primitive' ? localObject : localObject._value}
                    schemaMap={schemaMap}
                    setLocalObject={() => false}
                />
            </Paper>
        );
    },
    '$/composer/Array': ({ localSchema, localObject, setLocalObject, schemaMap }: any) => {
        const classes = useStyles();
        const metadata = getMetadata(localObject);
        const elementSchema = localSchema._parameters._element;
        return (
            <Paper variant="outlined" className={classes.editorFrame}>
                <div style={{ display: 'flex' }}>
                    <Typography>Array type</Typography>
                    <Add
                        onClick={() => {
                            if (Object.keys(typeMapUnigraph).includes(elementSchema?.type?.['unigraph.id'])) {
                                window.unigraph.updateObject(
                                    localObject.uid,
                                    {
                                        '_value[': {
                                            [typeMapUnigraph[elementSchema.type['unigraph.id']]]:
                                                defaultNewValues[elementSchema.type['unigraph.id']],
                                            _index: {
                                                '_value.#i': localObject['_value[']?.length,
                                            },
                                        },
                                    },
                                    true,
                                    false,
                                );
                            }
                        }}
                    />
                </div>
                <MetadataDisplay metadata={metadata} />
                {localObject['_value[']?.map((el: any) => (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            paddingTop: '8px',
                        }}
                    >
                        <ObjectPartEditor
                            localSchema={elementSchema}
                            localObject={el}
                            schemaMap={schemaMap}
                            setLocalObject={() => false}
                        />
                        <Delete
                            onClick={() => {
                                window.unigraph.deleteItemFromArray(localObject.uid, el.uid);
                            }}
                            className="showOnHover"
                        />
                    </div>
                ))}
            </Paper>
        );
    },
    default: ({ localSchema, localObject, setLocalObject, schemaMap }: any) => (
        <Typography>
            Object part, uid:
            {localObject?.uid}
        </Typography>
    ),
    '$/primitive/number': ({ localSchema, localObject, setLocalObject, schemaMap }: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.#i']);

        return (
            <>
                <TextField
                    onChange={(e) => {
                        setCurrentInputValue(e.target.value);
                    }}
                    value={currentInputValue}
                />
                <Save
                    onClick={() =>
                        window.unigraph.updateObject(
                            localObject.uid,
                            { '_value.#i': Number(currentInputValue) },
                            false,
                            false,
                        )
                    }
                    opacity={Number(currentInputValue) === localObject['_value.#i'] ? 0 : 1}
                />
            </>
        );
    },
    '$/primitive/string': ({ localSchema, localObject, setLocalObject, schemaMap }: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.%']);

        return (
            <>
                <TextField
                    onChange={(e) => {
                        setCurrentInputValue(e.target.value);
                    }}
                    value={currentInputValue}
                    multiline
                    fullWidth
                />
                <Save
                    onClick={() =>
                        window.unigraph.updateObject(localObject.uid, { '_value.%': currentInputValue }, false, false)
                    }
                    opacity={currentInputValue === localObject['_value.%'] ? 0 : 1}
                />
            </>
        );
    },
    '$/primitive/datetime': ({ localSchema, localObject, setLocalObject, schemaMap }: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState<any>(new Date(localObject['_value.%dt']));

        return (
            <>
                <KeyboardDateTimePicker
                    onChange={setCurrentInputValue}
                    value={currentInputValue}
                    format="yyyy/MM/DD HH:mm"
                    ampm={false}
                />
                <Save
                    onClick={() =>
                        window.unigraph.updateObject(
                            localObject.uid,
                            { '_value.%dt': currentInputValue.toISOString() },
                            false,
                            false,
                        )
                    }
                    opacity={currentInputValue.toISOString() === localObject['_value.%dt'] ? 0 : 1}
                />
            </>
        );
    },
    '$/primitive/boolean': ({ localSchema, localObject, setLocalObject, schemaMap }: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.!']);

        return (
            <>
                <Checkbox
                    onChange={(e) => {
                        setCurrentInputValue(e.target.checked);
                    }}
                    checked={currentInputValue}
                />
                <Save
                    onClick={() =>
                        window.unigraph.updateObject(localObject.uid, { '_value.!': currentInputValue }, false, false)
                    }
                    opacity={currentInputValue === localObject['_value.!'] ? 0 : 1}
                />
            </>
        );
    },
    schemaRef: ({ localSchema, localObject, setLocalObject, schemaMap }: any) => {
        const metadata = getMetadata(localObject);
        if (typeof localSchema !== 'string') localSchema = localSchema?.type?.['unigraph.id'];
        const [newValueUid, setNewValueUid] = React.useState('');
        const [showReplacer, setShowReplacer] = React.useState(false);
        const [viewOrEdit, setViewOrEdit] = React.useState<any>(
            getDynamicViews().includes(localObject.type?.['unigraph.id']) ? 'view' : 'edit',
        );
        const classes = useStyles();
        const definition =
            localSchema === '$/schema/any'
                ? schemaMap[
                      localObject[Object.keys(localObject).filter((s: string) => s.startsWith('_value'))[0]]?.type?.[
                          'unigraph.id'
                      ]
                  ]?._definition
                : schemaMap[localSchema]._definition;
        // console.log(localSchema, localObject, definition)
        return (
            <Paper variant="outlined" className={classes.editorFrame}>
                <div style={editorHeader}>
                    <Typography onClick={() => setShowReplacer(!showReplacer)} style={{ marginRight: '8px' }}>
                        Schema ref:
                        {localSchema}, uid:
                        {localObject.uid}
                    </Typography>
                    {viewOrEdit}
                    <Switch
                        checked={viewOrEdit === 'view'}
                        onChange={() => (viewOrEdit === 'view' ? setViewOrEdit('edit') : setViewOrEdit('view'))}
                    />
                </div>
                <MetadataDisplay metadata={metadata} />
                <div
                    style={{
                        ...editorHeader,
                        display: showReplacer ? 'flex' : 'none',
                    }}
                >
                    <TextField
                        onChange={(e) => {
                            setNewValueUid(e.target.value);
                        }}
                        value={newValueUid}
                    />
                    <Button
                        onClick={async () => {
                            await window.unigraph.deleteRelation(localObject.uid, { _value: null });
                            window.unigraph.updateObject(
                                localObject.uid,
                                { _value: { uid: newValueUid } },
                                true,
                                false,
                            );
                        }}
                    >
                        Set new UID
                    </Button>
                </div>
                {viewOrEdit === 'view' ? (
                    <AutoDynamicView object={localObject} />
                ) : (
                    <ObjectPartEditor
                        localSchema={definition}
                        localObject={
                            localObject[Object.keys(localObject).filter((s: string) => s.startsWith('_value'))[0]]
                        }
                        schemaMap={schemaMap}
                        setLocalObject={() => false}
                    />
                )}
            </Paper>
        );
    },
};

function getPartEditor(type: string, localSchema: any) {
    return Object.keys(TypedObjectPartEditor).includes(type)
        ? TypedObjectPartEditor[type]
        : type?.startsWith('$/schema/')
        ? TypedObjectPartEditor.schemaRef
        : TypedObjectPartEditor.default;
}

export function ObjectPartEditor({ localSchema, localObject, setLocalObject, schemaMap }: any) {
    const innerEl = React.createElement(getPartEditor(localSchema?.type?.['unigraph.id'] || localSchema, localSchema), {
        localSchema,
        localObject,
        setLocalObject,
        schemaMap,
    });

    return <div>{innerEl}</div>;
}

export function ObjectEditorSelector({ currentUid, setCurrentUid, style }: any) {
    const [currentSchema, setCurrentSchema]: [any, any] = React.useState(null);
    const [currentSchemaSHName, setCurrentSchemaSHName]: any = React.useState(null);
    const [referenceables, setReferenceables] = React.useState([]);

    const [currentInputUid, setCurrentInputUid] = React.useState(currentUid || '');

    useEffectOnce(() => {
        window.unigraph.getReferenceables().then((refs: any) => setReferenceables(refs));
    });

    return (
        <>
            <TextField
                onChange={(e) => {
                    setCurrentInputUid(e.target.value);
                }}
                value={currentInputUid}
            />
            <Button onClick={() => setCurrentUid(currentInputUid)}>Load object</Button>
            Schema name:{' '}
            <ReferenceableSelectorControlled
                referenceables={referenceables}
                onChange={(schema: string) =>
                    window.unigraph.getSchemas().then((schemas: Record<string, SchemaDgraph>) => {
                        setCurrentSchema(schemas[schema]);
                        setCurrentSchemaSHName(schema);
                    })
                }
                value={currentSchema?._definition?.type['unigraph.id']}
            />
            <Button
                onClick={async () => {
                    const returnUid = await window.unigraph.addObject({}, currentSchemaSHName);
                    setCurrentUid(returnUid);
                }}
            >
                Create with schema
            </Button>
        </>
    );
}

function ObjectEditorBody({ currentObject, setCurrentObject, schemaMap }: any) {
    const currentSchema =
        currentObject.type['_value[']?.[0]?._definition || schemaMap[currentObject.type['unigraph.id']]._definition;
    const classes = useStyles();

    return (
        <div style={{ display: 'flex' }}>
            <Grid container>
                <Grid item xs={12} lg={8} style={{ overflow: 'auto' }}>
                    <div>
                        <ObjectPartEditor
                            localSchema={currentSchema}
                            localObject={currentObject}
                            setLocalObject={setCurrentObject}
                            schemaMap={schemaMap}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <div>
                        <Paper variant="outlined" className={classes.editorFrame}>
                            <BacklinkView data={currentObject} hideHeader titleBar=" backlinks" />
                        </Paper>
                        <Paper variant="outlined" className={classes.editorFrame}>
                            <BacklinkView data={currentObject} hideHeader forward titleBar=" forward links" />
                        </Paper>
                    </div>
                </Grid>
            </Grid>
        </div>
    );
}

export function ObjectEditor({ uid }: any) {
    const [currentUid, setCurrentUid] = React.useState(uid || '');
    const [currentObject, setCurrentObject]: any = React.useState(null);

    const [subsId, setSubsId]: any = React.useState(null);

    const [allSchemas, setAllSchemas] = React.useState(null);

    const tabContext = React.useContext(TabContext);

    useEffectOnce(() => {
        window.unigraph.getSchemas().then((schemas: any) => setAllSchemas(schemas));
    });

    React.useEffect(() => {
        if (subsId) window.unigraph.unsubscribe(subsId);
        const newSubs = getRandomInt();
        if (currentUid) tabContext.subscribeToObject(currentUid, setCurrentObject, subsId);
        setSubsId(newSubs);
        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, [currentUid]);

    return (
        <div>
            <ObjectEditorSelector setCurrentUid={setCurrentUid} currentUid={currentUid} />
            <Divider />
            {currentUid.length && currentObject && allSchemas ? (
                <ObjectEditorBody
                    currentObject={currentObject}
                    setCurrentObject={setCurrentObject}
                    schemaMap={allSchemas}
                />
            ) : (
                'No object selected'
            )}
        </div>
    );
}
