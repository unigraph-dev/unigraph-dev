import React from "react";

export default function ExplorerHome(){
    const [messages, setMessages]: [string[], Function] = React.useState(window.unigraph.backendMessages);

    window.unigraph.addMessageListener((array: string[]) => setMessages(array))

    return <div>
        <h1>Connection status</h1>
        <p>Connection readyState (connecting=0, open=1, closing=2, closed=3): {window.unigraph.backendConnection.readyState}</p>
        <p>Connected to: {window.unigraph.backendConnection.url}</p>
        <h1>Messages</h1>
        {messages.map(message => {
            return <code>{message}</code>
        })}
    </div>
}
