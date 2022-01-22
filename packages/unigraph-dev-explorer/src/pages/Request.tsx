import { Button, Typography } from '@material-ui/core';
import React from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';

require('codemirror/lib/codemirror.css');

const templateRequests = {
    'get-all-objects-with-id': `{
        "type": "event",
        "event": "query_by_string_with_vars",
        "query": "query findByName() {entities(func: has(unigraph.id)) {uid expand(_predicate_) { uid expand(_predicate_)}}}",
        "vars": {},
        "id": ${Date.now()}
    }`,
    'get-status': `{
        "type": "event",
        "event": "get_status",
        "id": ${Date.now()}
    }`,
    'subscribe-all': `{
        "type": "event",
        "event": "subscribe_to_object",
        "id": ${Date.now()},
        "queryFragment": "(func: has(unigraph.id)) {uid expand(_predicate_) { uid expand(_predicate_)}}" 
    }`,
};

export default function Request() {
    const [code, setCode]: [string, any] = React.useState('// Your request here...');

    return (
        <div>
            <Typography variant="h4">Do a request!</Typography>
            <CodeMirror
                value={code}
                onBeforeChange={(editor: any, data: any, value: string) => {
                    setCode(value);
                }}
                onChange={(editor: any, data: any, value: string) => false}
                options={{ lineNumbers: true, mode: 'javascript' }}
            />
            <Button
                onClick={() => {
                    window.unigraph.backendConnection.current?.send(code);
                }}
            >
                Send to server
            </Button>
            <p>Templates: </p>
            <Button onClick={() => setCode(templateRequests['get-all-objects-with-id'])}>
                Get all objects with ID
            </Button>
            <Button onClick={() => setCode(templateRequests['get-status'])}>Get server status</Button>
            <Button onClick={() => setCode(templateRequests['subscribe-all'])}>Subscribe to all changes</Button>
        </div>
    );
}
