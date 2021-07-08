/* eslint-disable react-hooks/rules-of-hooks */ // Using maps as React functional components
import { Button, TextField, Typography } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { Definition, SchemaDgraph } from 'unigraph-dev-common/lib/types/json-ts';
import { ReferenceableSelectorControlled } from './ReferenceableSelector';

// TODO: Support for adding entries
// TODO: Support for padding unpadded (with entityUtils)

const TypedObjectPartEditor: any = {
    "$/composer/Object": ({localSchema, localObject, setLocalObject}: any) => {
        const [fields, setFields] = React.useState<[any, any][]>([]);

        return <React.Fragment>
            {fields.map(([key, value]) => <div>
                <Typography variant="body1">{key}</Typography>
                <ObjectPartEditor
                    localSchema={(localSchema['_definition']['_properties']).filter((el: any) => el['_key'] === key)[0]}
                    localObject={localObject['_value'][key]}
                    setLocalObject={(newVal: any) => setLocalObject(_.merge({}, localObject, {_value: {[key]: newVal}}))}
                />
            </div>)}
        </React.Fragment>
    }
}

function getPartEditor(type: string) {
    return Object.keys(TypedObjectPartEditor).includes(type) ? TypedObjectPartEditor[type] : TypedObjectPartEditor['default']
}

export const ObjectPartEditor = ({localSchema, localObject, setLocalObject}: any) => {

    let innerEl = React.createElement(getPartEditor(localSchema['_definition']['type']['unigraph.id']), {
        localSchema, localObject, setLocalObject
    });

    return <div>
        {innerEl}
    </div>
}

export const ObjectEditor = () => {

    const [currentSchema, setCurrentSchema]: [any, Function] = React.useState(null)
    const [currentSchemaSHName, setCurrentSchemaSHName]: any = React.useState(null)
    const [referenceables, setReferenceables] = React.useState([]);
    const [allSchemas, setAllSchemas] = React.useState({});

    const [currentObject, setCurrentObject]: any = React.useState({})

    useEffectOnce(() => {
        window.unigraph.getReferenceables().then((refs: any) => setReferenceables(refs));
        window.unigraph.getSchemas().then((schemas: any) => setAllSchemas(schemas));
    })

    return <div>
        Schema name: <ReferenceableSelectorControlled 
            referenceables={referenceables}
            onChange={(schema: string) => window.unigraph.getSchemas()
                .then((schemas: Record<string, SchemaDgraph>) => {setCurrentSchema(schemas[schema]); setCurrentSchemaSHName(schema)})}
            value={currentSchema?._definition?.type['unigraph.id']}
        />
        {currentSchema ? <div>
            <ObjectPartEditor localSchema={currentSchema} localObject={currentObject} setLocalObject={setCurrentObject} />
            {JSON.stringify(currentObject)}
        </div> : []}
        <Button onClick={()=> {window.unigraph.addObject(currentObject, currentSchemaSHName)}}>Submit (WIP)</Button>
    </div>
}