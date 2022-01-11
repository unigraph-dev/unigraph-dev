import Sugar from 'sugar';
import { inlineRefsToChildren } from '../../components/UnigraphCore/InlineSearchPopup';
import { ATodoList, setHours, getMinDate, getMaxDate } from './utils';

export const parseTodoObject: (arg0: string, refs?: any[]) => ATodoList = (todoString: string, refs?: any[]) => {
    // TODO: Using regex for now, we can switch to a more centralized parsing solution later
    const tagsRegex = /#[a-zA-Z0-9]*\b ?/gm;
    let tags = todoString.match(tagsRegex) || [];
    tags = tags.map((tag) => tag.slice(1).trim());
    todoString = todoString.replace(tagsRegex, '');

    const priorityRegex = /![0-9]\b ?/m;
    const priority = todoString.match(priorityRegex) || [];
    const priorityNum = parseInt(priority[0]?.slice(1), 10) || 0;
    todoString = todoString.replace(priorityRegex, '');

    const calendarRegex = /@([^- \t\n\r"]+|"[^-"]+")(?:-([^- \t\n\r"]+|"[^-"]+"))? ?/m;
    const calendarMatches = (todoString.match(calendarRegex) || []).map((el) =>
        el?.startsWith('"') ? el.replace(/"/g, '') : el,
    );
    let timeFrame;
    if (calendarMatches[1]?.length) {
        const calendar = calendarMatches[2] ? calendarMatches : ['', '', calendarMatches[1]];
        console.log(calendar, Sugar.Date.create('tomorrow'));
        timeFrame = {
            start: {
                datetime:
                    (!calendar[1]?.length ? undefined : setHours(Sugar.Date.create(calendar[1]), 0, 0, 0, 0)) ||
                    getMinDate(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                datetime:
                    (!calendar[2]?.length ? undefined : setHours(Sugar.Date.create(calendar[2]), 23, 59, 59, 999)) ||
                    getMaxDate(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        };
        todoString = todoString.replace(calendarRegex, '');
    }

    return {
        name: {
            type: { 'unigraph.id': '$/schema/markdown' },
            _value: todoString,
        },
        done: false,
        priority: priorityNum,
        children: [
            ...tags.map((tagName) => ({
                type: { 'unigraph.id': '$/schema/interface/semantic' },
                _value: {
                    type: { 'unigraph.id': '$/schema/tag' },
                    name: tagName,
                },
            })),
            ...inlineRefsToChildren(refs),
        ],
        time_frame: timeFrame,
    };
};
