import { find, findLast, flatten, flow, has, prop } from 'lodash/fp';
import Sugar from 'sugar';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';

export const maxDateStamp = 8640000000000000;
export const getMinDate = () => new Date(0);
export const getMaxDate = () => new Date(maxDateStamp);
export const setHours = (date: Date, h: number, m: number, s: number, ms: number) => {
    if (!date.getHours() && !date.getMinutes() && !date.getSeconds() && !date.getMilliseconds()) {
        date.setHours(h, m, s, ms);
    }
    return date;
};

export type ATodoList = {
    uid?: string;
    name: string | any;
    done: boolean;
    priority: number;
    children: any[];
    time_frame?: {
        start: { datetime: Date };
        end: { datetime: Date };
    };
};

export const filters = [
    {
        id: 'only-incomplete',
        fn: (obj: any) => {
            let r;
            try {
                const done = new UnigraphObject(obj).get('done').as('primitive');
                r = unpad(obj).done === false;
            } catch (e) {
                r = false;
            }
            return r;
        },
    },
    {
        id: 'only-complete',
        fn: (obj: any) => {
            let r;
            try {
                const done = new UnigraphObject(obj).get('done').as('primitive');
                r = unpad(obj).done === true;
            } catch (e) {
                r = false;
            }
            return r;
        },
    },
    {
        id: 'high-priority',
        fn: (obj: any) => {
            let r;
            try {
                const priority = new UnigraphObject(obj).get('priority').as('primitive');
                r = priority >= 1;
            } catch (e) {
                r = false;
            }
            return r;
        },
    },
    {
        id: 'until-today',
        fn: (obj: any) => {
            let r;
            try {
                const endDatetime = new UnigraphObject(obj).get('time_frame/end/datetime').as('primitive');
                r = new Date(endDatetime).getTime() <= getEod(new Date()).getTime();
            } catch (e) {
                r = false;
            }
            return r;
        },
    },
];

export const groupByTags = (els: any[]) => {
    const groupsMap: any = {};
    // console.log('groupByTags', els);
    els.forEach((it: any) => {
        const elTags = (it.get('children')?.['_value['] || [])
            .filter((tag: any) => tag?._value?._value?.type?.['unigraph.id'] === '$/schema/tag')
            .map((tag: any) => tag?._value?._value?._value?.name?.['_value.%']);
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

export const sortDatedTodosByEnd = (a: any, b: any) => {
    return (
        Sugar.Date.create(new Date(new UnigraphObject(a).get('time_frame/end/datetime').as('primitive'))).getTime() -
        Sugar.Date.create(new Date(new UnigraphObject(b).get('time_frame/end/datetime').as('primitive'))).getTime()
    );
};
export const groupTodoByTimeFrameEnd = (els: any[]) => {
    // Group and sort todos by timeframe end (due date), putting overdue todos in one group
    // 1. Find all timeframed todos and group them
    const timeframedTodos = els.filter(has(['_value', 'time_frame']));
    const groups: any = {};
    groups[Sugar.Date.medium(new Date())] = [];
    timeframedTodos.forEach((el) => {
        const dd = Sugar.Date.medium(new Date(new UnigraphObject(el).get('time_frame/end/datetime').as('primitive')));
        if (groups[dd]) groups[dd].push(el);
        else groups[dd] = [el];
    });
    // 2. Sort groups of timeframedTodos
    const finalGroups: any = Object.entries(groups)
        .sort((a, b) => Sugar.Date.create(a[0]).getTime() - Sugar.Date.create(b[0]).getTime())
        .map(([key, value]: any) => {
            const items = flatten(value.sort(sortDatedTodosByEnd));
            const endOfDayKey = getEod(new Date(key)).getTime();
            const endOfToday = getEod(new Date()).getTime();
            const isBeforeNow = endOfDayKey < endOfToday;
            const name = isBeforeNow ? 'Overdue' : key;

            return { name, items };
        });
    const overdue = {
        name: 'Overdue',
        items: finalGroups
            .filter((x: any) => x.name === 'Overdue')
            .map(prop('items'))
            .flat(),
    };
    const notOverdue = finalGroups.filter((x: any) => x.name !== 'Overdue');

    return [overdue, ...notOverdue];
};

export const groupers = { tags: groupByTags, due_date: groupTodoByTimeFrameEnd };

export const getEod = (date: Date) => {
    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    date.setMilliseconds(999);
    return date;
};

export const completeTodoQueryBody = `
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
}`;

// get inbox uid from name - have to get count from the type field
export const getTodoInboxCountQuery = (uid: string) =>
    `inbox_todos(func: uid(${uid})) @cascade{
        _value{children{<_value[>{_value{
            paths as math(1) 
            _value{
            type @filter(eq(<unigraph.id>,"$/schema/todo")){ 
                uid <unigraph.id>
                num_todos:math(paths)
            }
            _value{
                done @filter(eq(<_value.!>, false)) {
                    uid
                }
            }
        }}}}}
    }`;
export const getTodoInboxCountFromRes = prop([
    '0',
    '_value',
    'children',
    '_value[',
    '0',
    '_value',
    '_value',
    'type',
    'num_todos',
]);

export const getAllTodoCountQuery = () =>
    `todos(func: eq(<unigraph.id>, "$/schema/todo")) @cascade{
        <~type> {
            todoCounts: count(uid)
            _value{
                done @filter(eq(<_value.!>, false)) {
                    uid
                }
            }
        }
    }

    `;
export const getAllTodoCountFromRes = flow(prop(['0', '~type']), findLast(has('todoCounts')), prop('todoCounts'));

export const getUpcomingTodoCountQuery = () =>
    `todos(func: eq(<unigraph.id>, "$/schema/todo")) @cascade{
        <~type> {
            todoCounts: count(uid)
            _value{
                done @filter(eq(<_value.!>, false)) {
                    uid
                }
                time_frame {
                    uid _value {
                        dgraph.type uid type { <unigraph.id> }
                        _value {
                            end {
                                uid _value {
                                    _value { datetime { <_value.%dt> } }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    `;
export const getUpcomingTodoCountFromRes = getAllTodoCountFromRes;

export const getTodayTodoCountQuery = () =>
    `todos(func: eq(<unigraph.id>, "$/schema/todo")) @cascade{
        <~type> {
            todoCounts: count(uid)
            _value{
                done @filter(eq(<_value.!>, false)) {
                    uid
                }
                time_frame {
                    uid _value {
                        dgraph.type uid type { <unigraph.id> }
                        _value {
                            end {
                                uid _value {
                                    _value { datetime @filter(le(<_value.%dt>, "${getEod(
                                        new Date(),
                                    ).toJSON()}"))  { <_value.%dt> } }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    `;
export const getTodayTodoCountFromRes = getAllTodoCountFromRes;

export const getTaggedTodoCountQuery = (tagUid: string) =>
    `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted))) @cascade{
        todoCounts: count(uid)
        uid
        type @filter(eq(<unigraph.id>, "$/schema/todo")) { <unigraph.id> }
        _value{
            done @filter(eq(<_value.!>, false)) {
                <_value.!>
            }
        }
    }
    var(func: uid(${tagUid})) {
        <unigraph.origin> {
            res as uid
        }
    }`;
export const getTaggedTodoCountFromRes = flow(find(has('todoCounts')), prop('todoCounts'));
