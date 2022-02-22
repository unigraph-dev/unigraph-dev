import { mdiTagOutline } from '@mdi/js';
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
import { ATodoList, filters, getEod, groupByTags, groupers, groupTodoByTimeFrameEnd } from './utils';

export const TodoInbox = (props: any) => (
    <AutoDynamicViewDetailed
        object={{
            uid: window.unigraph.getNamespaceMap?.()?.['$/entity/inbox']?.uid,
            _stub: true,
            type: { 'unigraph.id': '$/schema/list' },
        }}
        attributes={{ reverse: true, noRemover: true, initialTab: '$/schema/todo', ...props }}
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
    };
};

const maketodoMenuItemsFromTag = (tag: any): TodoMenuItems => {
    return {
        [tag.get('name').as('primitive')]: {
            iconPath: mdiTagOutline,
            text: tag.get('name').as('primitive'),
            tag,
            component: (props: any) => {
                console.log('BacklinkView', { tag, props, name: tag.get('name').as('primitive') });
                return <BacklinkView data={tag} {...props} initialTab="$/schema/todo" />;
            },
        },
    };
};

export const TodoMenuSidebar = ({ mode, setMode, todoMenuModes, setTodoMenuModes, todoListProps }: any) => {
    const tabContext = React.useContext(TabContext);

    useEffectOnce(() => {
        const subsId = getRandomInt();

        tabContext.subscribeToType('$/schema/tag', (result: any) => {
            console.log(`subscribed to $/schema/tag`, result);
            const todoTags = result
                .map(maketodoMenuItemsFromTag)
                .reduce((acc: TodoMenuItems, newVal: TodoMenuItems) => {
                    return { ...acc, ...newVal };
                }, {});
            setTodoMenuModes((menuItems: TodoMenuItems) => {
                return { ...menuItems, ...todoTags };
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
                        <ListItem sx={pointerHoverSx} onClick={() => setMode(key)} selected={key === mode}>
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
