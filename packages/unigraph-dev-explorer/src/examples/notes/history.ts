import { findUid, getRandomId, getRandomInt, mergeObjectWithUpdater } from 'unigraph-dev-common/lib/utils/utils';

export const getChildrenStubMap = (objChildren: any) => {
    return {
        uid: objChildren.uid,
        '_value[': (objChildren['_value['] || []).map((child: any) => ({
            uid: child.uid,
            _key: child._key,
            _index: child?._index,
            _value: {
                uid: child?._value?.uid,
                type: child?._value?.type,
                _value: {
                    uid: child?._value?._value?.uid,
                    type: child?._value?._value?.type,
                },
            },
        })),
    };
};

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

    const currentObjs: Record<string, any> = {};
    if (currentCommand) {
        const toUpdate: any[] = [];
        const eventId = getRandomInt();
        currentCommand.forEach((change: ChangeState, idx: number) => {
            if (!currentObjs[change.subsId] && change.subsId)
                currentObjs[change.subsId] = window.unigraph.getDataFromSubscription?.(change.subsId);
            const data = currentObjs[change.subsId];

            if (change.type === 'children') {
                const [currentText] = findUid(data, change.uid);
                currentFuture.push({
                    type: 'children',
                    subsId: change.subsId,
                    uid: change.uid,
                    oldChildrenUid: currentText?.children.uid,
                    oldData: getChildrenStubMap(currentText?.children),
                });
                if (change.oldData) {
                    currentObjs[change.subsId] = mergeObjectWithUpdater(data, {
                        uid: change.uid,
                        children: change.oldData,
                    });
                }
                toUpdate.push(() => {
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
                        undefined,
                        idx !== currentCommand.length - 1 ? undefined : eventId,
                    );
                });
                return true;
            }
            if (change.type === 'predicate') {
                const [currentText] = findUid(data, change.uid);
                currentFuture.push({
                    type: 'predicate',
                    subsId: change.subsId,
                    uid: change.uid,
                    predicate: change.predicate,
                    oldValue: currentText?.[change.predicate],
                });
                currentObjs[change.subsId] = mergeObjectWithUpdater(data, {
                    uid: change.uid,
                    [change.predicate]: change.oldData || change.oldValue,
                });
                toUpdate.push(() => {
                    window.unigraph.updateObject(
                        change.uid,
                        {
                            [change.predicate]: change.oldValue,
                        },
                        false,
                        false,
                        idx === currentCommand.length - 1 ? change.subsId : [],
                        [],
                        undefined,
                        idx !== currentCommand.length - 1 ? undefined : eventId,
                    );
                });
                return true;
            }
            if (change.type === 'textual') {
                const [currentText] = findUid(data, change.uid);
                currentFuture.push({
                    type: 'textual',
                    subsId: change.subsId,
                    uid: change.uid,
                    oldText: currentText?.['_value.%'],
                });
                currentObjs[change.subsId] = mergeObjectWithUpdater(data, {
                    uid: change.uid,
                    '_value.%': change.oldText,
                });
                toUpdate.push(() => {
                    window.unigraph.updateObject(
                        change.uid,
                        {
                            '_value.%': change.oldText,
                        },
                        false,
                        false,
                        idx === currentCommand.length - 1 ? change.subsId : [],
                        [],
                        undefined,
                        idx !== currentCommand.length - 1 ? undefined : eventId,
                    );
                });
                return true;
            }
            return false;
        });
        console.log(currentCommand);
        Object.entries(currentObjs).forEach(([key, value]: any, index) => {
            console.log(key, value);
            window.unigraph.sendFakeUpdate?.(
                key,
                value,
                index === Object.entries(currentObjs).length - 1 ? eventId : undefined,
                true,
            );
        });
        toUpdate.forEach((fn) => {
            fn();
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
