export interface Unigraph {
    backendConnection: WebSocket;
    backendMessages: string[];
    eventTarget: EventTarget;
    createSchema(schema: any): Promise<any>;
    ensureSchema(name: string, fallback: any): Promise<any>;
    subscribeToType(name: string, callback: Function, eventId: number | undefined): Promise<number>;
    subscribeToObject(uid: string, callback: Function, eventId: number | undefined): Promise<number>;
    unsubscribe(id: number): any;
    addObject(object: any, schema: string): any;
    deleteObject(uid: string): any;
    unpad(object: any): any;
    updateSimpleObject(object: any, predicate: string, value: any): any;
    getReferenceables(): Promise<any>;
    getReferenceables(key: string | undefined, asMapWithContent: boolean | undefined): Promise<any>;
}
export declare type RefUnigraphIdType<UID extends string = string> = {
    $ref: {
        key: 'unigraph.id';
        query: UID;
    };
};
export declare function makeUnigraphId(id: string): {
    'unigraph.id': string;
};
export declare function makeRefUnigraphId(id: string): RefUnigraphIdType;
export default function unigraph(url: string): Unigraph;
