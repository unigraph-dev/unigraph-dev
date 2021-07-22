/* eslint-disable react-hooks/rules-of-hooks */ // Using maps as React functional components
import { Button, Checkbox, Divider, makeStyles, Paper, TextField, Typography } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { Definition, SchemaDgraph } from 'unigraph-dev-common/lib/types/json-ts';
import { KeyboardDateTimePicker } from "@material-ui/pickers";
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { ReferenceableSelectorControlled } from './ReferenceableSelector';
import { Save } from '@material-ui/icons';

const useStyles = makeStyles({
    editorFrame: {
        padding: "16px"
    },
    editorColumn: {}
});


const TypedObjectPartEditor: any = {
    "$/composer/Object": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [fields, setFields] = React.useState<any[]>(_.intersection(Object.keys(localObject['_value']), localSchema['_properties'].map((el: any) => el['_key'])));
        const classes = useStyles();
        return <React.Fragment>
            <Paper variant="outlined" className={classes.editorFrame}>
                {fields.map((key) => <div style={{display: "flex", alignItems: "baseline", paddingTop: "8px"}}>
                    <Typography variant="body1" style={{paddingRight: "8px"}}>{key}:</Typography>
                    <ObjectPartEditor
                        localSchema={(localSchema['_properties']).filter((el: any) => el['_key'] === key)[0]['_definition']}
                        localObject={localObject['_value'][key]} schemaMap={schemaMap}
                        setLocalObject={(newVal: any) => window.unigraph.updateObject(localObject['_value'][key]['uid'], newVal, false, false)}
                    />
                </div>)}
            </Paper>
        </React.Fragment>
    },
    "$/composer/Union": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        console.log(localObject, localSchema)
        const currentUnionType = localObject['_value']['type']['unigraph.id'];
        const classes = useStyles();
        return <Paper variant="outlined" className={classes.editorFrame}>
            <Typography>Union type - object type: {currentUnionType}</Typography>
            <ObjectPartEditor
                localSchema={schemaMap[currentUnionType]['_definition']}
                localObject={localObject[Object.keys(localObject).filter((s: string) => s.startsWith( '_value'))[0]]}
                schemaMap={schemaMap}
                setLocalObject={() => {}}
            />
        </Paper>
    },
    "$/composer/Array": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const classes = useStyles();
        console.log(localSchema, localObject)
        return <Paper variant="outlined" className={classes.editorFrame}>
            <Typography>Array type</Typography>
            {localObject['_value['].map((el: any) => <ObjectPartEditor
                        localSchema={schemaMap[el['_value']['type']['unigraph.id']]['_definition']}
                        localObject={el['_value']} schemaMap={schemaMap}
                        setLocalObject={() => {}}
                    />)}
        </Paper>
    },
    "default": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        return <Typography>Object part</Typography>
    },
    "$/primitive/number": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.#i']);

        return <React.Fragment>
            <TextField onChange={(e) => {setCurrentInputValue(e.target.value)}} value={currentInputValue}></TextField>
            <Save onClick={() => window.unigraph.updateObject(localObject.uid, {"_value.#i": Number(currentInputValue)}, false, false)} opacity={Number(currentInputValue) === localObject['_value.#i'] ? 0 : 1}></Save>
        </React.Fragment>
    },
    "$/primitive/string": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.%']);

        return <React.Fragment>
            <TextField onChange={(e) => {setCurrentInputValue(e.target.value)}} value={currentInputValue}></TextField>
            <Save onClick={() => window.unigraph.updateObject(localObject.uid, {"_value.%": currentInputValue}, false, false)} opacity={currentInputValue === localObject['_value.%'] ? 0 : 1}></Save>
        </React.Fragment>
    },
    "$/primitive/datetime": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState<any>(new Date(localObject['_value.%dt']));

        return <React.Fragment>
            <KeyboardDateTimePicker onChange={setCurrentInputValue} value={currentInputValue} format="yyyy/MM/DD HH:mm" ampm={false}></KeyboardDateTimePicker>
            <Save onClick={() => window.unigraph.updateObject(localObject.uid, {"_value.%dt": currentInputValue.toISOString()}, false, false)} opacity={currentInputValue.toISOString() === localObject['_value.%dt'] ? 0 : 1}></Save>
        </React.Fragment>
    },
    "$/primitive/boolean": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.!']);

        return <React.Fragment>
            <Checkbox onChange={(e) => {setCurrentInputValue(e.target.checked)}} checked={currentInputValue}></Checkbox>
            <Save onClick={() => window.unigraph.updateObject(localObject.uid, {"_value.!": currentInputValue}, false, false)} opacity={currentInputValue === localObject['_value.!'] ? 0 : 1}></Save>
        </React.Fragment>
    },
    "schemaRef": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        console.log(localSchema)
        if (typeof localSchema !== "string") localSchema = localSchema?.['type']?.['unigraph.id']
        
        const classes = useStyles();
        const definition = localSchema === "$/schema/any" ? schemaMap[localObject[Object.keys(localObject).filter((s: string) => s.startsWith( '_value'))[0]]['type']['unigraph.id']]['_definition'] : schemaMap[localSchema]['_definition']
        console.log(localSchema, localObject, definition)
        return <Paper variant="outlined" className={classes.editorFrame}>
            <Typography>Schema ref: {localSchema}</Typography>
            <ObjectPartEditor
                localSchema={definition}
                localObject={localObject[Object.keys(localObject).filter((s: string) => s.startsWith( '_value'))[0]]}
                schemaMap={schemaMap}
                setLocalObject={() => {}}
            />
        </Paper>
    },
}

function getPartEditor(type: string, localSchema: any) {
    return Object.keys(TypedObjectPartEditor).includes(type) ? TypedObjectPartEditor[type] : 
        (type.startsWith('$/schema/') ? TypedObjectPartEditor['schemaRef'] : TypedObjectPartEditor['default'])
}

export const ObjectPartEditor = ({localSchema, localObject, setLocalObject, schemaMap}: any) => {

    let innerEl = React.createElement(getPartEditor(localSchema?.['type']?.['unigraph.id'] || localSchema, localSchema), {
        localSchema, localObject, setLocalObject, schemaMap
    });

    return <div>
        {innerEl}
    </div>
}

export const ObjectEditorSelector = ({currentUid, setCurrentUid}: any) => {

    const [currentSchema, setCurrentSchema]: [any, Function] = React.useState(null)
    const [currentSchemaSHName, setCurrentSchemaSHName]: any = React.useState(null)
    const [referenceables, setReferenceables] = React.useState([]);

    const [currentInputUid, setCurrentInputUid] = React.useState(currentUid || '');

    useEffectOnce(() => {
        window.unigraph.getReferenceables().then((refs: any) => setReferenceables(refs));
    })

    return <div>
        <TextField onChange={(e) => {setCurrentInputUid(e.target.value)}} value={currentInputUid}></TextField>
        <Button onClick={() => setCurrentUid(currentInputUid)}>Load object</Button>
        Schema name: <ReferenceableSelectorControlled 
            referenceables={referenceables}
            onChange={(schema: string) => window.unigraph.getSchemas()
                .then((schemas: Record<string, SchemaDgraph>) => {setCurrentSchema(schemas[schema]); setCurrentSchemaSHName(schema)})}
            value={currentSchema?._definition?.type['unigraph.id']}
        />
        <Button onClick={async ()=> {
            const returnUid = await window.unigraph.addObject({}, currentSchemaSHName);
            setCurrentUid(returnUid);
        }}>Create with schema</Button>
    </div>
}

const ObjectEditorBody = ({currentObject, setCurrentObject, schemaMap}: any) => {
    const [currentSchema, setCurrentSchema]: [any, Function] = React.useState(currentObject['type']['_value['][0]['_definition'])
    

    return <div>
        <ObjectPartEditor localSchema={currentSchema} localObject={currentObject} setLocalObject={setCurrentObject} schemaMap={schemaMap} />
    </div>
}

export const ObjectEditor = ({uid}: any) => {
    const [currentUid, setCurrentUid] = React.useState(uid || "");
    const [currentObject, setCurrentObject]: any = React.useState(null);

    const [subsId, setSubsId]: any = React.useState(null);

    const [allSchemas, setAllSchemas] = React.useState(null);

    useEffectOnce(() => {
        window.unigraph.getSchemas().then((schemas: any) => setAllSchemas(schemas));
    })

    React.useEffect(() => {
        if (subsId) window.unigraph.unsubscribe(subsId);
        const newSubs = getRandomInt();
        if (currentUid) window.unigraph.subscribeToObject(currentUid, setCurrentObject, subsId);
        setSubsId(newSubs);
        return function cleanup () {window.unigraph.unsubscribe(subsId)};
    }, [currentUid])

    return <div>
        <ObjectEditorSelector setCurrentUid={setCurrentUid} currentUid={currentUid} />
        <Divider/>
        {
            (currentUid.length && currentObject && allSchemas) ? <ObjectEditorBody currentObject={currentObject} setCurrentObject={setCurrentObject} schemaMap={allSchemas}/> : "No object selected"
        }
    </div>

}