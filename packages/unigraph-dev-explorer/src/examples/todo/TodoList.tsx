import { Button, Checkbox, Chip, ListItemText, TextField, Typography } from '@material-ui/core';
import { CalendarToday, PriorityHigh } from '@material-ui/icons';
import React, { useState } from 'react';
import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Sugar from 'sugar';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicViewRenderer } from '../../global.d';

import { registerDynamicViews, registerQuickAdder, withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { parseTodoObject } from './parseTodoObject';
import { ATodoList, filters, maxDateStamp } from './utils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';

function TodoListBody({ data }: { data: ATodoList[] }) {
    const todoList = data;

    const [filteredItems, setFilteredItems] = React.useState(todoList);

    React.useEffect(() => {
        const res = todoList;
        setFilteredItems(res);
    }, [todoList]);

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <DynamicObjectListView
                items={filteredItems}
                context={null}
                filters={filters}
                defaultFilter="only-incomplete"
                compact
            />
        </div>
    );
}

export const TodoItem: DynamicViewRenderer = ({ data, callbacks, compact, inline }) => {
    // console.log(data);
    const unpadded: ATodoList = unpad(data);
    // console.log(unpadded)
    const totalCallbacks = {
        ...(callbacks || {}),
        onUpdate: (newData: Record<string, any>) => {
            window.unigraph.updateObject(
                newData.uid,
                {
                    _value: {
                        done: { '_value.!': newData.get('done')['_value.!'] },
                    },
                    _hide: newData.get('done')['_value.!'],
                },
                true,
                false,
            );
        },
    };
    // console.log(data.uid, unpadded)
    return (
        <div style={{ display: 'flex' }}>
            <Checkbox
                checked={unpadded.done}
                onClick={(_) => {
                    data.get('done')['_value.!'] = !data.get('done')['_value.!'];
                    totalCallbacks.onUpdate(data);
                }}
            />
            <ListItemText
                style={{ margin: compact ? '0px' : '', alignSelf: 'center' }}
                primary={
                    <AutoDynamicView
                        object={data.get('name')._value._value}
                        noDrag
                        noDrop
                        noContextMenu
                        callbacks={{
                            'get-semantic-properties': () => data,
                        }}
                    />
                }
                secondary={
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            flexWrap: 'wrap',
                        }}
                    >
                        {!unpadded.children?.map
                            ? []
                            : data?._value?.children?.['_value[']
                                  ?.filter((it: any) => !it._key)
                                  .map((it: any) => (
                                      <AutoDynamicView
                                          object={new UnigraphObject(it._value)}
                                          callbacks={callbacks}
                                          inline
                                      />
                                  ))}
                        {unpadded.priority > 0
                            ? [<Chip size="small" icon={<PriorityHigh />} label={`Priority ${unpadded.priority}`} />]
                            : []}
                        {unpadded.time_frame?.start?.datetime &&
                        new Date(unpadded.time_frame?.start?.datetime).getTime() !== 0
                            ? [
                                  <Chip
                                      size="small"
                                      icon={<CalendarToday />}
                                      label={`Start: ${Sugar.Date.relative(
                                          new Date(unpadded.time_frame?.start?.datetime),
                                      )}`}
                                  />,
                              ]
                            : []}
                        {unpadded.time_frame?.end?.datetime &&
                        new Date(unpadded.time_frame?.start?.datetime).getTime() !== maxDateStamp
                            ? [
                                  <Chip
                                      size="small"
                                      icon={<CalendarToday />}
                                      label={`End: ${Sugar.Date.relative(
                                          new Date(unpadded.time_frame?.end?.datetime),
                                      )}`}
                                  />,
                              ]
                            : []}
                    </div>
                }
            />
        </div>
    );
};

const quickAdder = async (
    inputStr: string,
    // eslint-disable-next-line default-param-last
    preview = true,
    callback?: any,
    refs?: any,
) => {
    const parsed = parseTodoObject(inputStr, refs);
    console.log(parsed);
    if (!preview)
        // eslint-disable-next-line no-return-await
        return await window.unigraph.addObject(parsed, '$/schema/todo');
    return [parsed, '$/schema/todo'];
};

const tt = () => (
    <>
        <Typography style={{ color: 'gray' }}>Examples:</Typography>
        <Typography>@tomorrow-&quot;next Friday&quot; #unigraph hello world</Typography>
        <Typography style={{ color: 'gray' }} variant="body2">
            doable from tomorrow, due next Friday
        </Typography>
        <Typography>@tomorrow #unigraph hello world</Typography>
        <Typography style={{ color: 'gray' }} variant="body2">
            due tomorrow
        </Typography>
        <Typography>!5 very important stuff</Typography>
        <Typography style={{ color: 'gray' }} variant="body2">
            priority 5
        </Typography>
    </>
);

export const init = () => {
    const description = 'Add a new Todo object';
    registerDynamicViews({ '$/schema/todo': TodoItem });
    registerQuickAdder({
        todo: {
            adder: quickAdder,
            tooltip: tt,
            description,
            alias: ['td'],
        },
    });
};

export const TodoList = withUnigraphSubscription(
    TodoListBody,
    { schemas: [], defaultData: [], packages: [todoPackage] },
    {
        afterSchemasLoaded: (subsId: number, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType(
                '$/schema/todo',
                (result: ATodoList[]) => {
                    setData(result.map((el: any) => ({ ...el, _stub: true })));
                },
                subsId,
                {
                    showHidden: true,
                    queryAs: ' { uid type { <unigraph.id> } _hide _value { done { <_value.!> } } } ',
                },
            );
        },
    },
);
