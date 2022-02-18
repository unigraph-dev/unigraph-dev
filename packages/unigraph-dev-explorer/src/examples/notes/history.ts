import { findUid } from 'unigraph-dev-common/lib/utils/utils';

export type ChildrenChangeState = {
    type: 'children';
    subsId: any;
    uid: string;
    oldChildrenUid: string;
    oldData?: any;
};

export type PredicateChangeState = {
    type: 'predicate';
    subsId: any;
    uid: string;
    predicate: string;
    oldValue: any;
    oldData?: any;
};

export type TextualChangeState = {
    type: 'textual';
    subsId: any;
    uid: string;
    oldText: string;
};

export type ChangeState = ChildrenChangeState | TextualChangeState | PredicateChangeState;
export type CommandState = ChangeState[];

export type HistoryState = {
    history: CommandState[];
    future: CommandState[];
};

export const applyCommand = (history: HistoryState, redo?: boolean): HistoryState => {
    const currentCommand = redo ? history.future.pop() : history.history.pop();
    const currentFuture: CommandState = [];
    if (currentCommand) {
        currentCommand.forEach((change: ChangeState, idx: number) => {
            if (change.type === 'children') {
                const data = window.unigraph.getDataFromSubscription?.(change.subsId);
                const [currentText] = findUid(data, change.uid);
                currentFuture.push({
                    type: 'children',
                    subsId: change.subsId,
                    uid: change.uid,
                    oldChildrenUid: currentText?.children.uid,
                });
                window.unigraph.updateObject(
                    change.uid,
                    {
                        children: {
                            uid: change.oldChildrenUid,
                        },
                    },
                    false,
                    false,
                    idx === currentCommand.length - 1 ? change.subsId : [],
                    [],
                );
                return true;
            }
            if (change.type === 'predicate') {
                const data = window.unigraph.getDataFromSubscription?.(change.subsId);
                const [currentText] = findUid(data, change.uid);
                currentFuture.push({
                    type: 'predicate',
                    subsId: change.subsId,
                    uid: change.uid,
                    predicate: change.predicate,
                    oldValue: currentText?.[change.predicate],
                });
                window.unigraph.updateObject(
                    change.uid,
                    {
                        [change.predicate]: change.oldValue,
                    },
                    false,
                    false,
                    idx === currentCommand.length - 1 ? change.subsId : [],
                    [],
                );
                return true;
            }
            if (change.type === 'textual') {
                const data = window.unigraph.getDataFromSubscription?.(change.subsId);
                const [currentText] = findUid(data, change.uid);
                currentFuture.push({
                    type: 'textual',
                    subsId: change.subsId,
                    uid: change.uid,
                    oldText: currentText?.['_value.%'],
                });
                window.unigraph.updateObject(
                    change.uid,
                    {
                        '_value.%': change.oldText,
                    },
                    false,
                    false,
                    change.subsId,
                    [],
                    true,
                );
                return true;
            }
            return false;
        });
    }
    if (currentFuture.length) redo ? history.history.push(currentFuture) : history.future.push(currentFuture);
    return history;
};

export const addCommand = (history: HistoryState, command: CommandState): HistoryState => {
    history.history.push(command);
    history.future = [];
    return history;
};

export const addTextualCommand = (history: HistoryState, subsId: any, uid: string, oldText: string): HistoryState => {
    history.history.push([
        {
            type: 'textual',
            uid,
            subsId,
            oldText,
        },
    ]);
    history.future = [];
    return history;
};
