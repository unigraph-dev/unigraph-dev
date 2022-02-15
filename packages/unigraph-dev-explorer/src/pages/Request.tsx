import { Button, Typography } from '@mui/material';
import React from 'react';
import Editor, { loader } from '@monaco-editor/react';

loader.config({ paths: { vs: './vendor/monaco-editor_at_0.31.1/' } });

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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h4">Do a request!</Typography>
            <div style={{ flexGrow: 1, width: '100%' }}>
                <Editor
                    defaultLanguage="json"
                    path="request.json"
                    value={code}
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={setCode}
                />
            </div>
            <div>
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
        </div>
    );
}
