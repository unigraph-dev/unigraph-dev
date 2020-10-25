export interface Unigraph {
    backendConnection: WebSocket;
    backendMessages: string[];
}

export default function unigraph(url: string): Unigraph {
    return {
        backendConnection: new WebSocket(url),
        backendMessages: []
    }
}

