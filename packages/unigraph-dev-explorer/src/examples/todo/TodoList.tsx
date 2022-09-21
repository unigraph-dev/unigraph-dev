import { Add as AddIcon, CalendarToday, PriorityHigh } from '@mui/icons-material';
import { Checkbox, Chip, Divider, Fab, ListItemText, Typography } from '@mui/material';
import _ from 'lodash/fp';
import React from 'react';
import Sugar from 'sugar';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { DynamicViewRenderer } from '../../global.d';
import { registerDynamicViews, registerQuickAdder } from '../../unigraph-react';
import { parseTodoObject } from './parseTodoObject';
import { todoDefaultMenuItems, TodoMenuItems, TodoMenuSidebar } from './TodoSidebar';
import { ATodoList, completeTodoQueryBody, maxDateStamp } from './utils';

const isImmediate = (data: any) =>
    new Date(data.get('time_frame/end/datetime')?.as('primitive')).getTime() - new Date().getTime() <=
    1000 * 60 * 60 * 24; // Less than a day

export const TodoItem: DynamicViewRenderer = ({ data, callbacks, compact, inline, isEmbed }) => {
    const NameDisplay = React.useMemo(
        () => (
            <AutoDynamicView
                object={data.get('name')?._value?._value}
                key="name"
                options={{ noDrag: true, noDrop: true, noContextMenu: true }}
                callbacks={{
                    'get-semantic-properties': () => data,
                }}
            />
        ),
        [data],
    );

    const SecondaryDisplay = React.useMemo(
        () => (
            <>
                {!data?._value?.children?.['_value[']
                    ? []
                    : data?._value?.children?.['_value[']
                          ?.filter((it: any) => !it._key)
                          .map((it: any) => (
                              <AutoDynamicView
                                  key={it.uid}
                                  object={new UnigraphObject(it._value)}
                                  callbacks={callbacks}
                                  options={{ inline: true }}
                                  onClick={(e: PointerEvent) => {
                                      e.stopPropagation();
                                  }}
                              />
                          ))}
                {data.get('priority')?.as('primitive') > 0
                    ? [
                          <Chip
                              size="small"
                              key="priority"
                              icon={<PriorityHigh />}
                              label={`Priority ${data.get('priority')?.as('primitive')}`}
                          />,
                      ]
                    : []}
                {data.get('time_frame/start/datetime')?.as('primitive') &&
                new Date(data.get('time_frame/start/datetime')?.as('primitive')).getTime() !== 0
                    ? [
                          <Chip
                              size="small"
                              key="timestart"
                              icon={<CalendarToday />}
                              label={`Start: ${Sugar.Date.relative(
                                  new Date(data.get('time_frame/start/datetime')?.as('primitive')),
                              )}`}
                          />,
                      ]
                    : []}
                {data.get('time_frame/end/datetime')?.as('primitive') &&
                new Date(data.get('time_frame/end/datetime')?.as('primitive')).getTime() !== maxDateStamp
                    ? [
                          <Chip
                              size="small"
                              key="timeend"
                              color={isImmediate(data) ? 'warning' : undefined}
                              icon={<CalendarToday />}
                              label={`End: ${Sugar.Date.relative(
                                  new Date(data.get('time_frame/end/datetime')?.as('primitive')),
                              )}`}
                          />,
                      ]
                    : []}
            </>
        ),
        [callbacks, data],
    );

    const onClick = React.useCallback(
        (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            data.get('done')['_value.!'] = !data.get('done')['_value.!'];
            window.unigraph.updateObject(
                data.uid,
                {
                    _value: {
                        uid: data._value.uid,
                        done: { uid: data._value.done.uid, '_value.!': data.get('done')['_value.!'] },
                    },
                    _hide: data.get('done')['_value.!'],
                },
                !data._value.uid,
                false,
                callbacks?.subsId,
                undefined,
                true,
            );
        },
        [data?.get('done')?.['_value.!'], callbacks?.subsId, data.uid],
    );

    const checkbox = React.useMemo(
        () => (
            <Checkbox
                size={callbacks.isEmbed ? 'small' : 'medium'}
                key="checkbox"
                style={{
                    padding: callbacks.isEmbed ? '2px' : '',
                    marginRight: callbacks.isEmbed ? '4px' : '',
                    alignSelf: 'baseline',
                }}
                checked={data.get('done')?.['_value.!']}
                onClick={onClick}
            />
        ),
        [data.get('done')?.['_value.!'], callbacks.isEmbed, onClick],
    );

    // console.log(data.uid, unpadded)
    return (
        <div style={{ display: 'flex', flexWrap: callbacks?.isEmbed ? 'wrap' : 'nowrap' }}>
            {callbacks.isEmbed && !callbacks.isEditing ? null : checkbox}
            {
                // eslint-disable-next-line no-nested-ternary
                callbacks.isEditing ? null : callbacks.isEmbed ? (
                    [
                        <div style={{ display: 'flex' }} key="primary">
                            {[checkbox, NameDisplay]}
                        </div>,
                        <div style={{ display: 'flex', marginLeft: '6px' }} key="secondary">
                            {SecondaryDisplay}
                        </div>,
                    ]
                ) : (
                    <ListItemText
                        style={{ margin: compact ? '0px' : '', alignSelf: 'center' }}
                        primary={NameDisplay}
                        key="name"
                        secondary={
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {SecondaryDisplay}
                            </div>
                        }
                    />
                )
            }
        </div>
    );
};
const parsedHasTags = (parsed: ATodoList | any) => {
    const tags = parsed?.children.filter(_.propEq(['_value', 'type', 'unigraph.id'], '$/schema/tag'));
    return tags ? tags.length > 0 : false;
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
    if (!preview) {
        // eslint-disable-next-line no-return-await
        const uid = await window.unigraph.addObject(parsed, '$/schema/todo');
        if (!parsedHasTags(parsed)) {
            window.unigraph.runExecutable(
                '$/executable/add-item-to-list',
                {
                    where: '$/entity/inbox',
                    item: uid,
                },
                undefined,
                undefined,
                true,
            );
        }
        return uid;
    }
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

const completeTodoQuery = (uid: string) => `
(func: uid(${uid})) {
    ${completeTodoQueryBody}
}`;

export const init = () => {
    const description = 'Add a new Todo object';
    registerDynamicViews({
        '$/schema/todo': {
            view: TodoItem,
            query: (uid: string) => completeTodoQuery(uid),
        },
    });
    registerQuickAdder({
        todo: {
            adder: quickAdder,
            tooltip: tt,
            description,
            alias: ['td'],
        },
    });
};

export const TodoList = (props: any) => {
    const [mode, setMode] = React.useState('inbox');

    const [todoViews, setTodoViews] = React.useState<TodoMenuItems>(() => {
        return todoDefaultMenuItems;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
            <div style={{ flexShrink: 0, height: '100%', overflowY: 'auto' }}>
                <TodoMenuSidebar
                    mode={mode}
                    setMode={setMode}
                    todoViews={todoViews}
                    setTodoViews={setTodoViews}
                    todoListProps={props}
                />
            </div>
            <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" sx={{ margin: '8px' }}>
                    {todoViews[mode].text}
                </Typography>
                {todoViews[mode].component({ ...props, key: mode })}
            </div>
            <Fab
                aria-label="add"
                style={{ position: 'absolute', right: '16px', bottom: '16px' }}
                onClick={() => {
                    window.unigraph.getState('global/omnibarSummoner').setValue({
                        show: true,
                        tooltip: 'Add a todo item',
                        defaultValue: '+todo ',
                    });
                }}
            >
                <AddIcon />
            </Fab>
        </div>
    );
};
