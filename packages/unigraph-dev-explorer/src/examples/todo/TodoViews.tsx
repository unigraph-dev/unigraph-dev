import { mdiBookOpenOutline, mdiCalendarAlert, mdiCalendarOutline, mdiInboxOutline, mdiTagOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { Drawer, ListItemText, ListSubheader } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import _, { flatten, has, prop } from 'lodash/fp';
import React from 'react';
import { useEffectOnce } from 'react-use';
import Sugar from 'sugar';
import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicViewDetailed } from '../../components/ObjectView/AutoDynamicViewDetailed';
import { BacklinkView } from '../../components/ObjectView/BacklinkView';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { withUnigraphSubscription } from '../../unigraph-react';
import { pointerHoverSx, TabContext } from '../../utils';
import { CurrentEvents } from '../calendar/CurrentEvents';
import { TodoTagView } from './TodoTagView';
import {
    ATodoList,
    filters,
    getEod,
    getTodoInboxCountFromRes,
    getTodoInboxCountQuery,
    groupByTags,
    groupers,
    groupTodoByTimeFrameEnd,
    getAllTodoCountQuery,
    getAllTodoCountFromRes,
    getTodayTodoCountQuery,
    getUpcomingTodoCountQuery,
    getTodayTodoCountFromRes,
    getUpcomingTodoCountFromRes,
    getTaggedTodoCountQuery,
    getTaggedTodoCountFromRes,
} from './utils';

export const TodoInbox = (props: any) => (
    <AutoDynamicViewDetailed
        object={{
            uid: window.unigraph.getNamespaceMap?.()?.['$/entity/inbox']?.uid,
            _stub: true,
            type: { 'unigraph.id': '$/schema/list' },
        }}
        attributes={{ reverse: true, initialTab: '$/schema/todo', ...props }}
    />
);

// export const TodoToday = (props: any) => {
//     return <CurrentEvents />;
// };

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

// const todoQueryAs = ' { uid type { <unigraph.id> } _updatedAt _createdAt _hide _value { done { <_value.!> } } } '
const todoQueryAs = ` 
{ 
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
      time_frame {
        _value {
            _value {
                start {
                    _value {
                        _value {
                            datetime {
                                <_value.%dt>
                            }
                        }
                    }
                }
                end {
                    _value {
                        _value {
                            datetime {
                                <_value.%dt>
                            }
                        }
                    }
                }
                
            }
        }
      }
    } 
} `;

const withSubscribeTodos = (component: React.FC<any>) => {
    return withUnigraphSubscription(
        component,
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
};
export const TodoAll = (props: any) => {
    const Component = withSubscribeTodos(TodoListBody);
    return <Component {...props} />;
};

function TodoTodayBody({ data }: { data: ATodoList[] }) {
    const todoList = data;

    const [filteredItems, setFilteredItems] = React.useState(todoList);

    React.useEffect(() => {
        const res = todoList;
        setFilteredItems(res);
        console.log('TodoUpcomingBody', { data });
    }, [todoList]);

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <DynamicObjectListView
                items={filteredItems}
                context={null}
                filters={filters}
                defaultFilter={['only-incomplete', 'until-today']}
                compact
                groupers={groupers}
                groupBy="due_date"
            />
        </div>
    );
}

export const TodoToday = (props: any) => {
    const Component = withSubscribeTodos(TodoTodayBody);
    return <Component {...props} />;
};

function TodoUpcomingBody({ data }: { data: ATodoList[] }) {
    const todoList = data;

    const [filteredItems, setFilteredItems] = React.useState(todoList);

    React.useEffect(() => {
        const res = todoList;
        setFilteredItems(res);
        console.log('TodoUpcomingBody', { data });
    }, [todoList]);

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <DynamicObjectListView
                items={filteredItems}
                context={null}
                filters={filters}
                defaultFilter="only-incomplete"
                compact
                groupers={groupers}
                groupBy="due_date"
            />
        </div>
    );
}

export const TodoUpcoming = (props: any) => {
    const Component = withSubscribeTodos(TodoUpcomingBody);
    return <Component {...props} />;
};

export type TodoMenuItems = {
    [key: string]: {
        iconPath: string | undefined;
        text: string;
        component: React.FC;
        tag?: any;
        getCountQuery?: (() => string | undefined) | undefined;
        getCountFromRes?: ((res: any) => number) | undefined;
    };
};

const maketodoMenuItemsFromTag = (tag: any): TodoMenuItems | undefined => {
    if (!tag.get('name')) return undefined;
    const tagName = tag.get('name').as('primitive');
    return {
        [tagName]: {
            iconPath: mdiTagOutline,
            text: tagName,
            tag,
            component: (props: any) => {
                console.log('TodoTagView', { tag, props, name: tagName });
                return <TodoTagView data={tag} {...props} initialTab="$/schema/todo" />;
            },
            getCountQuery: () => getTaggedTodoCountQuery(tag.uid),
            getCountFromRes: getTaggedTodoCountFromRes,
        },
    };
};

export const todoDefaultMenuItems: TodoMenuItems = {
    inbox: {
        iconPath: mdiInboxOutline,
        text: 'Inbox',
        component: TodoInbox,
        getCountQuery: () => {
            const inboxUid = window.unigraph.getNamespaceMap?.()?.['$/entity/inbox']?.uid;
            return inboxUid ? getTodoInboxCountQuery(inboxUid) : undefined;
        },
        getCountFromRes: getTodoInboxCountFromRes,
    },
    all: {
        iconPath: mdiBookOpenOutline,
        text: 'All Todos',
        component: TodoAll,
        getCountQuery: getAllTodoCountQuery,
        getCountFromRes: getAllTodoCountFromRes,
    },
    today: {
        iconPath: mdiCalendarOutline,
        text: 'Today',
        component: TodoToday,
        getCountQuery: getTodayTodoCountQuery,
        getCountFromRes: getTodayTodoCountFromRes,
    },
    upcoming: {
        iconPath: mdiCalendarAlert,
        text: 'Upcoming',
        component: TodoUpcoming,
        getCountQuery: getUpcomingTodoCountQuery,
        getCountFromRes: getUpcomingTodoCountFromRes,
    },
};

const TodoMenuSidebarItem = ({ iconPath, text, onClick, selected, getCountQuery, getCountFromRes }: any) => {
    const tabContext = React.useContext(TabContext);
    const [itemCount, setItemCount] = React.useState<number | undefined>(undefined);
    useEffectOnce(() => {
        if (getCountQuery) {
            const subsId = getRandomInt();
            tabContext.subscribeToQuery(
                getCountQuery(),
                (results: any[]) => {
                    console.log('subscribeToQuery', { itemCount, results, text, count: getCountFromRes(results) });
                    setItemCount(getCountFromRes(results));
                },
                subsId,
                { noExpand: true },
            );
            return function cleanup() {
                tabContext.unsubscribe(subsId);
            };
        }
        return undefined;
    });

    return (
        <ListItem sx={pointerHoverSx} onClick={onClick} selected={selected}>
            <ListItemIcon>{iconPath && <Icon path={iconPath as string} size={1} />}</ListItemIcon>
            <ListItemText primary={text} />
            {typeof itemCount === 'number' && (
                <ListItemText primary={itemCount} sx={{ textAlign: 'right', marginLeft: '8px' }} />
            )}
        </ListItem>
    );
};

export const TodoMenuSidebar = ({ mode, setMode, todoViews, setTodoViews, todoListProps }: any) => {
    // basically the same as todoViews but grouped by sections
    const [todoMenuItems, setTodoMenuItems] = React.useState<{ [key: string]: TodoMenuItems }>(() => {
        return { defaultViews: todoDefaultMenuItems };
    });
    const [archiveExpand, setArchiveExpand] = React.useState<boolean>(false);
    const tabContext = React.useContext(TabContext);

    useEffectOnce(() => {
        // Subscribe to tags in general
        const subsId = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/tag',
            (result: any) => {
                console.log(`subscribed to $/schema/tag`, result);
                const todoTags = result
                    .map(maketodoMenuItemsFromTag)
                    .filter(Boolean)
                    .reduce((acc: TodoMenuItems, newVal: TodoMenuItems) => {
                        return { ...acc, ...newVal };
                    }, {});
                setTodoViews((currentViews: TodoMenuItems) => {
                    return { ...currentViews, ...todoTags };
                });
                setTodoMenuItems((currentMenuItems: { [key: string]: TodoMenuItems }) => {
                    return { ...currentMenuItems, tags: { ...todoTags } };
                });
            },
            subsId,
        );

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    });

    useEffectOnce(() => {
        // Subscribe to archived tags
        // Not super efficient, ideally we'd query tags while filter for backlinks to $/entity/todo_archived_tags
        const subsId = getRandomInt();
        tabContext.subscribeToObject(
            '$/entity/todo_archived_tags',
            (result: any) => {
                const listContents = result.get('children')?.['_value['] || [];
                const archivedTodoTagObjs = listContents
                    .map((x: any) => new UnigraphObject(x?._value?._value))
                    .filter((x: any) => x.getType('$/schema/tag'));
                const archivedTodoTags = archivedTodoTagObjs
                    .map(maketodoMenuItemsFromTag)
                    .filter(Boolean)
                    .reduce((acc: TodoMenuItems, newVal: TodoMenuItems) => {
                        return { ...acc, ...newVal };
                    }, {});
                setTodoViews((currentViews: TodoMenuItems) => {
                    return { ...currentViews, ...archivedTodoTags };
                });
                console.log(`subscribed to $/entity/todo_archived_tags`, {
                    result,
                    archivedTodoTagObjs,
                    archivedTodoTags,
                });
                setTodoMenuItems((currentMenuItems: { [key: string]: TodoMenuItems }) => {
                    return { ...currentMenuItems, archivedTags: { ...archivedTodoTags } };
                });
            },
            subsId,
        );
        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    });

    const renderMenuItem = React.useCallback(
        (key: string) => (
            <TodoMenuSidebarItem {...todoViews[key]} onClick={() => setMode(key)} selected={key === mode} />
        ),
        [mode, setMode, todoViews],
    );

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                minWidth: '280px',
                flexShrink: 0,
            }}
        >
            <List>
                <ListSubheader component="div" id="subheader-home">
                    {' '}
                    Todo Views{' '}
                </ListSubheader>
                {_.keys(todoMenuItems.defaultViews).map(renderMenuItem)}
                <ListSubheader component="div" id="subheader-home">
                    {' '}
                    Tags{' '}
                </ListSubheader>
                {_.keys(todoMenuItems.tags)
                    .sort()
                    .filter((key) => !_.keys(todoMenuItems.archivedTags).includes(key))
                    .map(renderMenuItem)}
                {_.keys(todoMenuItems.archivedTags).length > 0 && (
                    <ListSubheader
                        component="div"
                        id="subheader-home"
                        sx={pointerHoverSx}
                        onClick={() => setArchiveExpand((prev) => !prev)}
                    >
                        {' '}
                        {archiveExpand ? 'V ' : '> '} Archived Tags{' '}
                    </ListSubheader>
                )}
                {archiveExpand && _.keys(todoMenuItems.archivedTags).sort().map(renderMenuItem)}
            </List>
        </Drawer>
    );
};
