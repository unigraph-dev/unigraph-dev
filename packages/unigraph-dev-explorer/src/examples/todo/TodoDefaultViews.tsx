import React from 'react';
import { pkg as todoPackage } from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import { AutoDynamicViewDetailed } from '../../components/ObjectView/AutoDynamicViewDetailed';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { withUnigraphSubscription } from '../../unigraph-react';
import { ATodoList, filters, groupByTags, groupers } from './utils';

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

function TodoListBodyFactory(filtersMaker: any[], attrs?: any) {
    return function ({ data }: { data: ATodoList[] }) {
        const todoList = data;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [filteredItems, setFilteredItems] = React.useState(todoList);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
            const res = todoList;
            setFilteredItems(res);
            // console.log('TodoListBody', { data });
        }, [todoList]);

        return (
            <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                <DynamicObjectListView
                    items={filteredItems}
                    context={null}
                    filters={filters}
                    defaultFilter={filtersMaker}
                    compact
                    groupers={{ ...groupers, tags: groupByTags }}
                    {...(attrs || {})}
                />
            </div>
        );
    };
}

const TodoListBody = TodoListBodyFactory(['only-incomplete']);
const UntaggedTodoListBody = TodoListBodyFactory(['only-incomplete', 'only-untagged']);
const TodoTodayBody = TodoListBodyFactory(['only-incomplete', 'until-today'], { groupBy: 'due_date' });
const TodoUpcomingBody = TodoListBodyFactory(['only-incomplete'], { groupBy: 'due_date' });

export const TodoAll = (props: any) => {
    const Component = withSubscribeTodos(TodoListBody);
    return <Component {...props} />;
};

export const TodoUntagged = (props: any) => {
    const Component = withSubscribeTodos(UntaggedTodoListBody);
    return <Component {...props} />;
};

export const TodoToday = (props: any) => {
    const Component = withSubscribeTodos(TodoTodayBody);
    return <Component {...props} />;
};

export const TodoUpcoming = (props: any) => {
    const Component = withSubscribeTodos(TodoUpcomingBody);
    return <Component {...props} />;
};
