import { Button } from '@material-ui/core';
import { Code } from '@material-ui/icons';
import React from 'react'
import CodeMirror from 'react-codemirror'

export default function Request () {
    let [code, setCode]: [string, Function] = React.useState("// Your request here...")
    
    function onCodeChanged (newValue: string, change: any)  {
        setCode(newValue)
    }

    return <div>
        <h1>Do a request!</h1>
        <CodeMirror value={code} onChange={onCodeChanged} options={{lineNumbers: true, mode: "javascript"}} />
        <Button onClick={() => {
            console.log(code)
            window.unigraph.backendConnection.send(code)
        }}>Send to server</Button>
    </div>
}