export type NoteEditorContext = {
    edited: { current: boolean } | undefined;
    setCommand: (cmd: any) => any;
    callbacks: any;
    nodesState: any;
    historyState: any;
};

export interface UnigraphObject {
    type?: {
        'unigraph.id': string;
    };
    uid: string;
}
