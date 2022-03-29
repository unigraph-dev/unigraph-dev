export type NoteEditorContext = {
    edited: any;
    setCommand: (a: any) => any;
    callbacks: any;
    nodesState: any;
    historyState: any;
};

export interface UnigraphObject {
    type?: {
        'unigraph.id': string;
    };
    uid?: string;
}
