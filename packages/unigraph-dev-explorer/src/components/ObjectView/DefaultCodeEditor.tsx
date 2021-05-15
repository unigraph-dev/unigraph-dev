import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { loader } from '@monaco-editor/react';
import Editor from "@monaco-editor/react";
import React from "react";
import { Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";

loader.config({ paths: { vs: './vendor/monaco-editor_at_0.23.0/min/vs' } });

// eslint-disable-next-line import/no-webpack-loader-syntax
const unigraphDecl: string = require('!!raw-loader!unigraph-dev-common/lib/types/unigraph.d.ts').default;
const beginStr = '/** Unigraph interface */'
const endStr = '/** End of unigraph interface */'
let decl = unigraphDecl.substring(
    unigraphDecl.lastIndexOf(beginStr)+beginStr.length,
    unigraphDecl.lastIndexOf(endStr)    
)
decl = decl.replace(/export declare type /g, "declare type ")
decl = decl.replace("export interface ", "declare interface ")
console.log(decl);

export const ExecutableCodeEditor = ({data}: any) => {
    
    const unpadded = unpad(data);

    const [currentCode, setCurrentCode] = React.useState(unpadded['src'])

    const updateCode = (newSrc: string) => 
        {window.unigraph.updateObject(data.uid, {src: newSrc})}

    function handleEditorChange(value: any, event: any) {
        setCurrentCode(value);
    }

    const displayData = {...unpadded};
    delete displayData['src']
    

    return <div>
        <div>
            {JSON.stringify(displayData)}
            <Button onClick={() => updateCode(currentCode)}><Save/></Button>
        </div>
        <Editor
            height="70vh"
            width="100vh"
            defaultLanguage="javascript"
            beforeMount={(monaco) => {
                monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: false,
                    noSyntaxValidation: false,
                    // Disable error codes: allow return value; no top level await *2; check for typescript annotation
                    diagnosticCodesToIgnore: [1108, 1375, 1378, 7044]
                });

                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ES2016,
                    allowNonTsExtensions: true
                });

                monaco.languages.typescript.javascriptDefaults.addExtraLib(decl + "\ndeclare var unigraph: Unigraph<WebSocket>; declare const unpad = (a:any) => any;declare const require = (a:any) => any;\ndeclare var context = {params: any}")
            }}
            defaultValue={currentCode}
            onChange={handleEditorChange}
        />
    </div>

}