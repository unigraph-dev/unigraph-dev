import React, { useEffect } from 'react';
import { Typography } from '@material-ui/core';
import Editor, { loader } from '@monaco-editor/react';
import { buildUnigraphEntity, processAutoref } from 'unigraph-dev-common/lib/utils/entityUtils';
import { useEffectOnce } from 'react-use';
import { ReferenceableSelectorControlled } from '../components/ObjectView/ReferenceableSelector';

loader.config({ paths: { vs: './vendor/monaco-editor_at_0.31.1/' } });

export default function DataModelPlayground() {
    const [origData, setOrigData] = React.useState('{}');
    const [processedData, setProcessedData] = React.useState('{}');

    const [referenceables, setReferenceables] = React.useState([]);
    const [name, setName]: [any, (_: any) => void] = React.useState(false);

    useEffectOnce(() => {
        window.unigraph.getReferenceables().then((refs: any) => setReferenceables(refs));
    });

    useEffect(() => {
        let transformed = '';
        try {
            const objUpdated = JSON.parse(origData);
            const schemaName = name || 'any';
            window.unigraph.getSchemas().then((schemas: any) => {
                try {
                    const unigraphObject = buildUnigraphEntity(objUpdated, schemaName, schemas);
                    transformed = processAutoref(unigraphObject, schemaName, schemas);
                    // console.log(transformed);
                    setProcessedData(JSON.stringify(transformed, null, 4));
                } catch (e: any) {
                    console.error(e);
                    transformed = `Processing error: \n${e.toString()}`;
                    setProcessedData(transformed);
                }
            });
        } catch (e: any) {
            transformed = `Invalid data entered: \n${e.toString()}`;
        }
        setProcessedData(transformed);
    }, [origData, name]);

    function handleOrigChange(value: any, event: any) {
        setOrigData(value);
    }
    function handleProcessedChange(value: any, event: any) {
        setProcessedData(value);
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h4">DataModel Playground</Typography>
            <p>Try composing an object here and see what happens!</p>
            <ReferenceableSelectorControlled referenceables={referenceables} onChange={setName} value={name} />
            <div style={{ display: 'flex', width: '100%', flexGrow: 1 }}>
                <div style={{ flexGrow: 1, width: '50%' }}>
                    <Editor
                        defaultLanguage="javascript"
                        path="before.json"
                        value={origData}
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={handleOrigChange}
                    />
                </div>
                <div style={{ flexGrow: 1, width: '50%' }}>
                    <Editor
                        defaultLanguage="javascript"
                        path="after.json"
                        value={processedData}
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={handleProcessedChange}
                    />
                </div>
            </div>
        </div>
    );
}
