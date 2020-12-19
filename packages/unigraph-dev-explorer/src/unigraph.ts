export interface Unigraph {
    backendConnection: WebSocket;
    backendMessages: string[];
    addEventListener(listener: Function): any;
}

export default function unigraph(url: string): Unigraph {
    let connection = new WebSocket(url);
    let messages: any[] = [];
    let listeners: Function[] = [];

    connection.onmessage = (ev) => {
        try {
            console.log(ev)
            let parsed = JSON.parse(ev.data);
            messages.push(parsed);
            listeners.forEach(listener => {
                listener(parsed)
            });
        } catch (e) {
            console.error("Returned non-JSON reply!")
            console.log(ev.data);
        }
    }
    

    return {
        backendConnection: connection,
        backendMessages: messages,
        addEventListener: (listener: Function) => listeners.push(listener)
    }
}

