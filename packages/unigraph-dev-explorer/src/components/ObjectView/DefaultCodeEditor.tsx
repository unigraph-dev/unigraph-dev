import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { loader } from '@monaco-editor/react';
import Editor from "@monaco-editor/react";
import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, List, ListItem, Typography } from "@material-ui/core";
import { ExpandMore, Save } from "@material-ui/icons";
import { SizeMe } from "react-sizeme";
import { Actions } from "flexlayout-react";
import { useEffectOnce } from "react-use";

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
decl = decl.replace(/export interface /g, "declare interface ")
decl = decl + "\ndeclare var unigraph: Unigraph<WebSocket>; declare const unpad = (a:any) => any;declare const require = (a:any) => any;\ndeclare var context = {params: any}";
console.log(decl);

export const ExecutableCodeEditor = ({data, options}: any) => {
    
    const unpadded = unpad(data);

    const [currentCode, setCurrentCode] = React.useState(unpadded['src'])
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const updateCode = (newSrc: string) => 
        {window.unigraph.updateObject(data.uid, {src: newSrc})}

    function handleEditorChange(value: any, event: any) {
        setCurrentCode(value);
    }

    useEffectOnce(() => {
        if (options?.viewId) { window.layoutModel.doAction(Actions.renameTab(options.viewId, `Code: ${unpadded['unigraph.id'].split('/').slice(-1).join('')}`)) }
    })    

    return <div style={{width: "100%"}}>
        <div style={{display: 'flex'}}>
        <Accordion expanded={optionsOpen} onChange={() => setOptionsOpen(!optionsOpen)} variant={"outlined"} style={{flexGrow: 1, marginBottom: '16px'}}> 
        <AccordionSummary  
          expandIcon={<ExpandMore />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography style={{flexBasis: '50%', flexShrink: 0}}>{unpadded.name}</Typography>
          <Typography color='textSecondary'>{unpadded.env}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <List>
                <ListItem>
                    <Typography style={{flexBasis: '33.33%', flexShrink: 0}}>unigraph.id</Typography>
                    <Typography color='textSecondary'>{unpadded['unigraph.id']}</Typography>
                </ListItem>
                <ListItem>
                    <Typography style={{flexBasis: '33.33%', flexShrink: 0}}>Periodic</Typography>
                    <Typography color='textSecondary'>{unpadded.periodic || "none"}</Typography>
                </ListItem>
            </List>

        </AccordionDetails>
      </Accordion>
      <IconButton onClick={() => updateCode(currentCode)}><Save/></IconButton>
        </div>
        <SizeMe>{({size}: any) => <div><Editor
            height={"70vh"}
            width={`${size.width}px`}
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

                monaco.languages.typescript.javascriptDefaults.addExtraLib(decl)
            }}
            defaultValue={currentCode}
            onChange={handleEditorChange}
        /></div>}</SizeMe>
    </div>

}