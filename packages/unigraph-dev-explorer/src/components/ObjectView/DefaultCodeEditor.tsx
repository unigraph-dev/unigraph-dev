import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { loader } from '@monaco-editor/react';
import Editor from "@monaco-editor/react";
import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Button, FormControl, IconButton, InputLabel, List, ListItem, MenuItem, Select, TextField, Typography } from "@material-ui/core";
import { ExpandMore, Save } from "@material-ui/icons";
import { Actions } from "flexlayout-react";
import { useEffectOnce } from "react-use";

import ReactResizeDetector from 'react-resize-detector';

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

const AddImportComponent = ({onAddImport}: any) => {
    const [pkgName, setPkgName] = React.useState("");
    const [impt, setImpt] = React.useState("");
    const [imptas, setImptas] = React.useState("");
    const [env, setEnv] = React.useState("");

    return <React.Fragment>
        <FormControl>
            <InputLabel>Select env</InputLabel>
            <Select label="Env" value={env} onChange={(ev) => setEnv(ev.target.value as string)}>
                <MenuItem value="">Env</MenuItem>
                <MenuItem value="npm">npm</MenuItem>
                <MenuItem value="unigraph">unigraph</MenuItem>
            </Select>
        </FormControl>
        <TextField label="Package name" value={pkgName} onChange={(ev) => setPkgName(ev.target.value)}>Pkg Name</TextField>
        <TextField label="Import" value={impt} onChange={(ev) => setImpt(ev.target.value)}>Import</TextField>
        <TextField label="As" value={imptas} onChange={(ev) => setImptas(ev.target.value)}>As</TextField>

        <Button onClick={() => {
            onAddImport(env, pkgName, impt, imptas)
        }}>Create</Button>
    </React.Fragment>
}

const ImportItem = ({data}: any) => {
    return <React.Fragment>
        <Typography>{data?.['env']['_value.%']}</Typography>
        <Typography>{data?.['package']['_value.%']}</Typography>
        <Typography>{data?.['import']?.['_value.%'] || "*"}</Typography>
        <Typography>{data?.['as']['_value.%']}</Typography>
    </React.Fragment>
}

const lang: any = {
    'component/react-jsx': 'jsx',
    'routine/js': "javascript",
    "lambda/js": "javascript",
    "client/js": "javascript",
}

const ext: any = {
    'component/react-jsx': '.jsx',
    'routine/js': ".js",
    "lambda/js": ".js",
    "client/js": ".js",
}

export const ExecutableCodeEditor = ({data, options}: any) => {
    
    const unpadded = unpad(data);

    const [currentCode, setCurrentCode] = React.useState(unpadded['src'])
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const [previewComponent, setPreviewComponent] = React.useState<any>("");

    const updateCode = (newSrc: string) => 
        {window.unigraph.updateObject(data.uid, {src: newSrc})}

    function handleEditorChange(value: any, event: any) {
        setCurrentCode(value);
    }

    useEffectOnce(() => {
        if (options?.viewId) { window.layoutModel.doAction(Actions.renameTab(options.viewId, `Code: ${unpadded['unigraph.id']?.split('/').slice(-1).join('') || data.uid}`)) }
    })    

    return <div style={{width: "100%", display: "flex", flexDirection: "column", height: "calc(100vh - 75px)"}}>
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
                    <List style={{width: "100%"}}>
                        <ListItem>
                            <Typography style={{flexBasis: '33.33%', flexShrink: 0, maxWidth: "240px"}}>unigraph.id</Typography>
                            <Typography color='textSecondary'>{unpadded['unigraph.id'] || "none"}</Typography>
                        </ListItem>
                        <ListItem>
                            <Typography style={{flexBasis: '33.33%', flexShrink: 0, maxWidth: "240px"}}>Periodic</Typography>
                            <Typography color='textSecondary'>{unpadded.periodic || "none"}</Typography>
                        </ListItem>
                        <ListItem style={{display: unpadded.env?.startsWith?.("component") ? "" : "none"}}>
                            <Button onClick={() => window.unigraph.runExecutable(unpadded['unigraph.id'] || data.uid, {}).then(
                                (comp: any) => setPreviewComponent(React.createElement(comp, {}, []))
                            )}>Preview</Button>
                        </ListItem><ListItem>
                            <Typography style={{flexBasis: '33.33%', flexShrink: 0, maxWidth: "240px"}}>Imports</Typography>
                            <List>
                                {(data?.['_value']?.['imports']?.['_value['] || []).map((el: any) => <ListItem><ImportItem data={el['_value']}/></ListItem>)}
                                <ListItem>
                                    <AddImportComponent onAddImport={(env: string, pkg: string, impt: string, imptAs: string) => {
                                        window.unigraph.updateObject(data.uid, {
                                            imports: [{
                                                env: env,
                                                package: pkg,
                                                import: impt,
                                                as: imptAs
                                            }]
                                        })
                                    }}/>
                                </ListItem>
                            </List>
                        </ListItem>
                    </List>
                    {previewComponent}
                </AccordionDetails>
            </Accordion>
            <IconButton onClick={() => updateCode(currentCode)}><Save/></IconButton>
        </div>
        <div style={{flexGrow: 1}}><ReactResizeDetector handleWidth handleHeight>{({width, height}: any) => <Editor
            height={height ? `${height}px` : undefined}
            width={`${width}px`}
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

                monaco.languages.typescript.javascriptDefaults.addExtraLib(decl);
                (data['_value']['imports']?.['_value['] || []).forEach((el: any) => {
                    if (el['_value']['env']['_value.%'] === "npm") {
                        // TODO: import references   
                    }
                })
            }}
            path={"main" + ext[unpadded['env']]}
            defaultValue={currentCode}
            onChange={handleEditorChange}
        />}</ReactResizeDetector></div>
        </div>

}