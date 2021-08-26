import React, { useEffect } from "react";
import { Typography } from "@material-ui/core";
import {Controlled as CodeMirror} from 'react-codemirror2';
import { buildUnigraphEntity, processAutoref } from "unigraph-dev-common/lib/utils/entityUtils";
import { useEffectOnce } from "react-use";
import { ReferenceableSelectorControlled } from "../components/ObjectView/ReferenceableSelector";
require('codemirror/lib/codemirror.css');

export default function DataModelPlayground () {
    let [origData, setOrigData] = React.useState('{}');
    let [processedData, setProcessedData] = React.useState('{}');

    const [referenceables, setReferenceables] = React.useState([]);
    const [name, setName]: [any, Function] = React.useState(false);

    useEffectOnce(() => { 
        window.unigraph.getReferenceables().then((refs: any) => setReferenceables(refs));
    })

    useEffect(() => {
        let transformed = "";
        try {
            const objUpdated = JSON.parse(origData);
            const schemaName = name || 'any';
            window.unigraph.getSchemas().then((schemas: any) => {
                try {
                    const unigraphObject = buildUnigraphEntity(objUpdated, schemaName, schemas);
                    transformed = processAutoref(unigraphObject, schemaName, schemas);
                    //console.log(transformed);
                    setProcessedData(JSON.stringify(transformed, null, 4));
                } catch (e) {
                    console.error(e);
                    transformed = 'Processing error: \n' + e.toString()
                    setProcessedData(transformed)
                }
            })
        } catch (e) {
            transformed = 'Invalid data entered: \n' + e.toString()
        }
        setProcessedData(transformed)
    }, [origData])

    return <div>

        <Typography variant="h4">DataModel Playground</Typography>
        <p>Try composing an object here and see what happens!</p>
        <ReferenceableSelectorControlled 
            referenceables={referenceables}
            onChange={setName}
            value={name}
        />
        <CodeMirror 
            value={origData} 
            onBeforeChange={(editor: any, data: any, value: string) => {setOrigData(value)}}
            onChange={(editor: any, data: any, value: string) => {}}
            options={{lineNumbers: true, mode: "javascript"}} 
        />
        <CodeMirror 
            value={processedData} 
            onBeforeChange={(editor: any, data: any, value: string) => {setProcessedData(value)}}
            onChange={(editor: any, data: any, value: string) => {}}
            options={{lineNumbers: true, mode: "javascript"}} 
        />
    </div>
}