/* eslint-disable react-hooks/rules-of-hooks */ // Using maps as React functional components
import { Button, Checkbox, Divider, TextField, Typography } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { Definition, SchemaDgraph } from 'unigraph-dev-common/lib/types/json-ts';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { ReferenceableSelectorControlled } from './ReferenceableSelector';

// TODO: Support for adding entries
// TODO: Support for padding unpadded (with entityUtils)

const TypedObjectPartEditor: any = {
    "$/composer/Object": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [fields, setFields] = React.useState<any[]>(_.intersection(Object.keys(localObject['_value']), localSchema['_properties'].map((el: any) => el['_key'])));

        return <React.Fragment>
            {fields.map((key) => <div style={{display: "flex"}}>
                <Typography variant="body1">{key}</Typography>
                : 
                <ObjectPartEditor
                    localSchema={(localSchema['_properties']).filter((el: any) => el['_key'] === key)[0]['_definition']}
                    localObject={localObject['_value'][key]} schemaMap={schemaMap}
                    setLocalObject={(newVal: any) => window.unigraph.updateObject(localObject['_value'][key]['uid'], newVal, false, false)}
                />
            </div>)}
        </React.Fragment>
    },
    "$/composer/Union": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const currentUnionType = localObject['_value']['type']['unigraph.id'];
        return <div>
            <Typography>Union type - object type: {currentUnionType}</Typography>
            <ObjectPartEditor
                localSchema={schemaMap[currentUnionType]['_definition']}
                localObject={localObject[Object.keys(localObject).filter((s: string) => s.startsWith( '_value'))[0]]}
                schemaMap={schemaMap}
                setLocalObject={() => {}}
            />
        </div>
    },
    "$/composer/Array": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        return <div>
            <Typography>Array type</Typography>
        </div>
    },
    "default": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        return <Typography>Object part</Typography>
    },
    "$/primitive/number": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.#i']);

        return <React.Fragment>
            <TextField onChange={(e) => {setCurrentInputValue(e.target.value)}} value={currentInputValue}></TextField>
            <Button onClick={() => setLocalObject({"_value.#i": Number(currentInputValue)})}>Update</Button>
        </React.Fragment>
    },
    "$/primitive/string": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.%']);

        return <React.Fragment>
            <TextField onChange={(e) => {setCurrentInputValue(e.target.value)}} value={currentInputValue}></TextField>
            <Button onClick={() => setLocalObject({"_value.%": currentInputValue})}>Update</Button>
        </React.Fragment>
    },
    "$/primitive/datetime": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.%dt']);

        return <React.Fragment>
            <TextField onChange={(e) => {setCurrentInputValue(e.target.value)}} value={currentInputValue}></TextField>
            <Button onClick={() => setLocalObject({"_value.%dt": currentInputValue})}>Update</Button>
        </React.Fragment>
    },
    "$/primitive/boolean": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        const [currentInputValue, setCurrentInputValue] = React.useState(localObject['_value.!']);

        return <React.Fragment>
            <Checkbox onChange={(e) => {setCurrentInputValue(e.target.checked)}} checked={currentInputValue}></Checkbox>
            <Button onClick={() => setLocalObject({"_value.!": currentInputValue})}>Update</Button>
        </React.Fragment>
    },
    "schemaRef": ({localSchema, localObject, setLocalObject, schemaMap}: any) => {
        if (typeof localSchema !== "string") localSchema = localSchema?.['type']?.['unigraph.id']
        console.log(schemaMap[localSchema], localSchema, schemaMap)
        return <div>
            <Typography>Schema ref: {localSchema}</Typography>
            <ObjectPartEditor
                localSchema={schemaMap[localSchema]['_definition']}
                localObject={localObject[Object.keys(localObject).filter((s: string) => s.startsWith( '_value'))[0]]}
                schemaMap={schemaMap}
                setLocalObject={() => {}}
            />
        </div>
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