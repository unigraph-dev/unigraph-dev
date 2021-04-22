import { Button, TextField } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { Definition, SchemaDgraph } from 'unigraph-dev-common/lib/types/json-ts';
import { ReferenceableSelectorControlled } from './ReferenceableSelector';

const recursiveBindField = (path: string, rootObj: any) => {
    const [currentObject, setCurrentObject]: any = rootObj;

    const onChange = (newValue: any) => {
        let newObj: any = {};
        let paths = path.split('/')
        let curr = newObj;
        //console.log(newValue)
        paths.slice(1, paths.length-1).forEach(key => {
            newObj[key] = {};
            curr = newObj[key];
        })
        curr[paths[paths.length-1]] = newValue;
        // @ts-ignore
        window.b = setCurrentObject
        setCurrentObject(JSON.parse(JSON.stringify({...currentObject, ...newObj})))
    }

    return onChange;
}

const getFieldsFromDefinition = (def: Definition, schemas: any, rootObj: any, path = "") => {
    //console.log(schemas)
    // @ts-ignore
    if (def.type['unigraph.id'].startsWith('$/schema')) def = schemas[def.type['unigraph.id']].definition;

    // @ts-ignore
    if(def.type['unigraph.id'] === '$/composer/Object') { // Generate object fields
        // @ts-ignore: already have properties. fix type later
        return def.properties.map((el) => <div>
            {[el.key, getFieldsFromDefinition(el.definition, schemas, rootObj, path+`/${el.key}`)]}
        </div>) // @ts-ignore
    } else if (def.type['unigraph.id'].startsWith('$/composer/Array')) {
        return "This is an array..."
        // @ts-ignore
    } else if (def.type['unigraph.id'].startsWith('$/primitive')) {
        let onFChange = recursiveBindField(path, rootObj)
        let val: Function = (v: string) => v;
        // @ts-ignore
        switch (def.type['unigraph.id']) {
            case "$/primitive/number":
                val = (v: string) => Number(v);
                break;
            case "$/primitive/boolean":
                val = (v: string) => Boolean(v);
                break;
            default:
                break;
        }
        return <TextField variant="outlined" onChange={(event) => {
            let newValue = event.target.value;
            onFChange(val(newValue));
        }}/>
    }
}

export const ObjectEditor = () => {

    const [currentSchema, setCurrentSchema]: [null | SchemaDgraph, Function] = React.useState(null)
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
            value={// @ts-ignore
                (currentSchema as unknown as SchemaDgraph)?.definition.type['unigraph.id']}
        />
        {currentSchema ? <div>
            {getFieldsFromDefinition((currentSchema as any).definition, allSchemas, [currentObject, setCurrentObject])}
            {JSON.stringify(currentObject)}
        </div> : []}
        <Button onClick={()=> {window.unigraph.addObject(currentObject, currentSchemaSHName)}}>Submit (WIP)</Button>
    </div>
}