import React from "react";

export default function ExplorerHome(){
    // @ts-ignore
    const [messages, setMessages]: [string[], Function] = React.useState(window.backendMessages);
    // @ts-ignore
    window.backendConnection.onmessage = (msg) => {
        // @ts-ignore
        window.backendMessages = [msg.data, ...messages]
        // @ts-ignore
        setMessages(window.backendMessages)
    }

    return <div>
        <h1>Connection status</h1>
        <p>Connection readyState (connecting=0, open=1, closing=2, closed=3): {
        // @ts-ignore
        window.backendConnection.readyState}</p>
        <p>Connected to: {
        // @ts-ignore
        window.backendConnection.url}</p>
        <h1>Messages</h1>
        {messages.map(message => {
            return <code>{message}</code>
        })}
    </div>
}