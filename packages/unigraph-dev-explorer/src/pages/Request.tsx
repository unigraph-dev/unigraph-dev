import { Button } from '@material-ui/core';
import React, from 'react';
import CodeMirror from 'react-codemirror';
require('codemirror/lib/codemirror.css');

export default function Request () {
    let [code, setCode]: [string, Function] = React.useState("// Your request here...")

    return <div>
        <h1>Do a request!</h1>
        <CodeMirror 
            value={code} 
            onChange={(newValue: string, change: any) => {setCode(newValue)}} 
            options={{lineNumbers: true, mode: "javascript"}} 
        />
        <Button onClick={() => {
            console.log(code)
            window.unigraph.backendConnection.send(code)
        }}>Send to server</Button>
    </div>
}