import { findUid } from 'unigraph-dev-common/lib/utils/utils';

export type ChildrenChangeState = {
    type: 'children';
    subsId: any;
    uid: string;
    oldChildrenUid: string;
};

export type TextualChangeState = {
    type: 'textual';
    subsId: any;
    uid: string;
    oldText: string;
};

export type ChangeState = ChildrenChangeState | TextualChangeState;
export type CommandState = ChangeState[];

export type HistoryState = {
    history: CommandState[];
    future: CommandState[];
};

export const applyCommand = (history: HistoryState, redo?: boolean): HistoryState => {
    const currentCommand = redo ? history.future.pop() : history.history.pop();
    const currentFuture: CommandState = [];
    if (currentCommand) {
        currentCommand.forEach((change: ChangeState) => {
            if (change.type === 'children') {
                return false;
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
