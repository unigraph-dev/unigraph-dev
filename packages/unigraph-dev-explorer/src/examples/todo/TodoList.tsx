import { Checkbox, Chip, ListItemText, Typography, Fab, Divider, Drawer, ListSubheader } from '@mui/material';
import { CalendarToday, PriorityHigh, Add as AddIcon } from '@mui/icons-material';
import React from 'react';
import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { pkg as semanticPackage } from 'unigraph-dev-common/lib/data/unigraph.semantic.pkg';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Sugar from 'sugar';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Icon from '@mdi/react';
import { mdiBookOpenOutline, mdiInboxOutline, mdiTagOutline } from '@mdi/js';
import _ from 'lodash/fp';
import { useEffectOnce } from 'react-use';
import { DynamicViewRenderer } from '../../global.d';

import { registerDynamicViews, registerQuickAdder, withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { parseTodoObject } from './parseTodoObject';
import { ATodoList, filters, maxDateStamp } from './utils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { pointerHoverSx, TabContext } from '../../utils';
import { AutoDynamicViewDetailed } from '../../components/ObjectView/AutoDynamicViewDetailed';
import { BacklinkView } from '../../components/ObjectView/BacklinkView';

const groupByTags = (els: any[]) => {
    const groupsMap: any = {};
    els.forEach((it: any) => {
        const elTags = (it.get('children')?.['_value['] || [])
            .filter((tag: any) => tag?._value?._value?.type?.['unigraph.id'] === '$/schema/tag')
            .map((tag: any) => tag?._value?._value?._value?.name?.['_value.%']);
        console.log('groupByTags', { it, els, groupsMap, elTags });
        elTags.forEach((tag: any) => {
            if (groupsMap[tag]) {
                groupsMap[tag].push(it);
            } else {
                groupsMap[tag] = [it];
            }
        });
    });
    return Object.entries(groupsMap)
        .map(([k, v]) => ({ name: k, items: v as any[] }))
        .sort((a, b) => (a.name > b.name ? 1 : -1));
};

function TodoListBody({ data }: { data: ATodoList[] }) {
    const todoList = data;

    const [filteredItems, setFilteredItems] = React.useState(todoList);

    React.useEffect(() => {
        const res = todoList;
        setFilteredItems(res);
        console.log('TodoListBody', { data });
    }, [todoList]);

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <DynamicObjectListView
                items={filteredItems}
                context={null}
                filters={filters}
                defaultFilter="only-incomplete"
                compact
                groupers={{ tags: groupByTags }}
            />
        </div>
    );
}

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
                                  object={new UnigraphObject(it._value)}
                                  callbacks={callbacks}
                                  options={{ inline: true }}
                              />
                          ))}
                {data.get('priority')?.as('primitive') > 0
                    ? [
                          <Chip
                              size="small"
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

    const onPointerUp = React.useCallback(
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
                onPointerUp={onPointerUp}
            />
        ),
        [data.get('done')?.['_value.!'], callbacks.isEmbed, onPointerUp],
    );

    // console.log(data.uid, unpadded)
    return (
        <div style={{ display: 'flex' }}>
            {checkbox}
            {
                // eslint-disable-next-line no-nested-ternary
                callbacks.isEditing ? (
                    []
                ) : callbacks.isEmbed ? (
                    [
                        NameDisplay,
                        <Divider
                            orientation="vertical"
                            style={{ marginLeft: '4px', marginRight: '4px' }}
                            key="divider"
                        />,
                        SecondaryDisplay,
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
        console.log('adding todo', { uid, parsed });

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

export const init = () => {
    const description = 'Add a new Todo object';
    registerDynamicViews({
        '$/schema/todo': {
            view: TodoItem,
            query: (uid: string) => `
            (func: uid(${uid})) {
                uid
                type { <unigraph.id> }
                dgraph.type
                <_hide>
                <_value> {
                    uid
                    name {
                        uid _value {
                            dgraph.type uid
                            type { <unigraph.id> }
                            _value { dgraph.type uid type { <unigraph.id> } <_value.%> }
                        }
                    }
                    done { uid <_value.!> }
                    priority { <_value.#i> }
                    time_frame {
                        uid _value {
                            dgraph.type uid type { <unigraph.id> }
                            _value {
                                start {
                                    uid _value {
                                        dgraph.type uid
                                        type { <unigraph.id> }
                                        _value { datetime { <_value.%dt> } timezone { <_value.%> } }
                                    }
                                }
                                end {
                                    uid _value {
                                        dgraph.type uid
                                        type { <unigraph.id> }
                                        _value { datetime { <_value.%dt> } timezone { <_value.%> } }
                                    }
                                }
                            }
                        }
                    }
                    children {
                        <_value[> {
                            uid _key _index {<_value.#i> uid}
                            _value {
                                dgraph.type uid type { <unigraph.id> }
                                _value {
                                    dgraph.type uid type { <unigraph.id> }
                                    _value {
                                        uid name { uid <_value.%> }
                                        color { uid _value { <_value.%> dgraph.type uid type { <unigraph.id> } } }
                                    }
                                }
                            }
                        }
                    }
                }
            }`,
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
const TodoInbox = (props: any) => (
    <AutoDynamicViewDetailed
        object={{
            uid: window.unigraph.getNamespaceMap?.()?.['$/entity/inbox']?.uid,
            _stub: true,
            type: { 'unigraph.id': '$/schema/list' },
        }}
        attributes={{ reverse: true, noBar: true, initialTab: '$/schema/todo', ...props }}
    />
);

const TodoAll = withUnigraphSubscription(
    TodoListBody,
    { schemas: [], defaultData: [], packages: [todoPackage] },
    {
        afterSchemasLoaded: (subsId: number, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType(
                '$/schema/todo',
                (result: ATodoList[]) => {
                    console.log('TodoList', { result, data: result.map((el: any) => ({ ...el, _stub: true })) });
                    setData(result.map((el: any) => ({ ...el, _stub: true })));
                },
                subsId,
                {
                    showHidden: true,
                    queryAs: todoQueryAs,
                },
            );
        },
    },
);

// function TodoMenuTagList({ data }: { data: any[] }) {
//     const tagList = data;

//     const [filteredItems, setFilteredItems] = React.useState(tagList);

//     React.useEffect(() => {
//         const res = tagList;
//         setFilteredItems(res);
//         console.log('TodoMenuTagList', { data, tagList });
//     }, [tagList]);

//     return <DynamicObjectListView items={filteredItems} context={null} compact noBar />;
// }

type TodoMenuItems = {
    [key: string]: {
        iconPath: string | undefined;
        text: string;
        component: any;
    };
};

const maketodoMenuItemsFromTag = (tag: any): TodoMenuItems => {
    return {
        [tag.get('name').as('primitive')]: {
            iconPath: mdiTagOutline,
            text: tag.get('name').as('primitive'),
            component: (props: any) => {
                console.log('BacklinkView', { tag, props, name: tag.get('name').as('primitive') });
                return <BacklinkView data={tag} {...props} initialTab="$/schema/todo" />;
            },
        },
    };
};

const TodoMenuSidebar = ({ mode, setMode, todoMenuModes, setTodoMenuModes, todoListProps }: any) => {
    const tabContext = React.useContext(TabContext);

    useEffectOnce(() => {
        const subsId = getRandomInt();

        tabContext.subscribeToType('$/schema/tag', (result: any) => {
            console.log(`subscribed to $/schema/tag`, result);
            setTodoMenuModes((menuItems: TodoMenuItems) => {
                const newMenuItems = result.map(maketodoMenuItemsFromTag);
                return newMenuItems.reduce((acc: TodoMenuItems, newVal: TodoMenuItems) => {
                    return { ...acc, ...newVal };
                }, menuItems);
            });
        });

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    });

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                flexShrink: 0,
            }}
        >
            <List>
                <ListSubheader component="div" id="subheader-home">
                    {' '}
                    Todo Views{' '}
                </ListSubheader>
                {_.keys(todoMenuModes).map((key: string) => {
                    return (
                        <ListItem sx={pointerHoverSx} onClick={() => setMode(key)}>
                            <ListItemIcon>
                                {todoMenuModes[key].iconPath && (
                                    <Icon path={todoMenuModes[key].iconPath as string} size={1} />
                                )}
                            </ListItemIcon>
                            <ListItemText primary={todoMenuModes[key].text} />
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );
};

// const todoQueryAs = ' { uid type { <unigraph.id> } _updatedAt _createdAt _hide _value { done { <_value.!> } } } '
const todoQueryAs = ` { 
    uid type { <unigraph.id> } _updatedAt _createdAt _hide
    _value {
      done { <_value.!> } 
      children {
        <_value[> {
          _value {
            _value{
              type { <unigraph.id> }
              _value { name{ <_value.%> } }
            }
          }
      }
      }
    } 
  } `;

const makeTodoInbox = (theseProps: any) => <TodoInbox {...theseProps} />;
const makeTodoAll = (theseProps: any) => <TodoAll {...theseProps} />;
export const TodoList = (props: any) => {
    const [mode, setMode] = React.useState('inbox');

    const [todoMenuModes, setTodoMenuModes] = React.useState<TodoMenuItems>(() => {
        return {
            inbox: {
                iconPath: mdiInboxOutline,
                text: 'Inbox',
                component: makeTodoInbox,
            },
            all: {
                iconPath: mdiBookOpenOutline,
                text: 'All Todos',
                component: makeTodoAll,
            },
        };
    });

    React.useEffect(() => {
        console.log('TodoList mode', { mode, todoMenuModes, componentFunc: todoMenuModes[mode].component });
    }, [todoMenuModes[mode].component]);

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ flexBasis: '15%', height: '100%' }}>
                <TodoMenuSidebar
                    mode={mode}
                    setMode={setMode}
                    todoMenuModes={todoMenuModes}
                    setTodoMenuModes={setTodoMenuModes}
                    todoListProps={props}
                />
            </div>
            <div style={{ flexBasis: '85%', height: '100%' }}>{todoMenuModes[mode].component({ ...props })}</div>
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
