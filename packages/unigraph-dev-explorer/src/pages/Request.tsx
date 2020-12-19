import { Button } from '@material-ui/core';
import React from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
require('codemirror/lib/codemirror.css');

const templateRequests = {
    "get-all-objects-with-id": `{
        "type": "event",
        "event": "query_by_string_with_vars",
        "query": "query findByName() {entities(func: has(unigraph.id)) {uid expand(_predicate_) { uid expand(_predicate_)}}}",
        "vars": {},
        "id": ${Date.now()}
    }`,
    "get-status": `{
        "type": "event",
        "event": "get_status",
        "id": ${Date.now()}
    }`
}

export default function Request () {
    let [code, setCode]: [string, Function] = React.useState("// Your request here...")

    return <div>
        <h1>Do a request!</h1>
        <CodeMirror 
            value={code} 
            onBeforeChange={(editor: any, data: any, value: string) => {setCode(value)}}
            onChange={(editor: any, data: any, value: string) => {}}
            options={{lineNumbers: true, mode: "javascript"}} 
        />
        <Button onClick={() => {
            console.log(code)
            window.unigraph.backendConnection.send(code)
        }}>Send to server</Button>
        <p>Templates: </p>
        <Button onClick={() => setCode(templateRequests['get-all-objects-with-id'])}>Get all objects with ID</Button>
        <Button onClick={() => setCode(templateRequests['get-status'])}>Get server status</Button>
    </div>
}