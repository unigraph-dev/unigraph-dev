export interface Unigraph {
    backendConnection: WebSocket;
    backendMessages: string[];
    addMessageListener: Function;
}

export default function unigraph(url: string): Unigraph {
    let conn = new WebSocket(url);
    let msgarray: any[] = [];
    let listeners: Function[] = [];
    conn.onmessage = (msg) => {
        window.unigraph.backendMessages = [msg.data, ...msgarray]
        listeners.forEach(fn => fn(msgarray))
    }
    return {
        backendConnection: conn,
        backendMessages: msgarray,
        addMessageListener: (fn: Function) => {
            listeners = [fn, ...listeners]
        }
    }
}

