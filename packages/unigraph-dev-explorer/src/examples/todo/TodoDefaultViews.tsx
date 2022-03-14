import React from 'react';
import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { AutoDynamicViewDetailed } from '../../components/ObjectView/AutoDynamicViewDetailed';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { withUnigraphSubscription } from '../../unigraph-react';
import { ATodoList, filters, groupByTags, groupers } from './utils';

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
