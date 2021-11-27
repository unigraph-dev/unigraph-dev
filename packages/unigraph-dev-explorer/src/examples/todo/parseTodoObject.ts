import Sugar from 'sugar';
import { ATodoList, setHours, getMinDate, getMaxDate } from "./utils";

export const parseTodoObject: (arg0: string) => ATodoList = (todoString: string) => {
    // TODO: Using regex for now, we can switch to a more centralized parsing solution later
    let tags_regex = /#[a-zA-Z0-9]*\b ?/gm;
    let tags = todoString.match(tags_regex) || [];
    tags = tags.map(tag => tag.slice(1).trim());
    todoString = todoString.replace(tags_regex, '');

    let priority_regex = /![0-9]\b ?/m;
    let priority = todoString.match(priority_regex) || [];
    let priority_num = parseInt(priority[0]?.slice(1)) || 0
    todoString = todoString.replace(priority_regex, '');

    let calendar_regex = /@([^- \t\n\r"]+|"[^-"]+")(?:-([^- \t\n\r"]+|"[^-"]+"))? ?/m;
    let calendar_matches = (todoString.match(calendar_regex) || []).map(el => el?.startsWith('"') ? el.replace(/"/g, '') : el);
    let time_frame = undefined
    if (calendar_matches[1]?.length) {
        let calendar = calendar_matches[2] ? calendar_matches : ["", "", calendar_matches[1]];
        console.log(calendar, Sugar.Date.create("tomorrow"))
        time_frame = {
            start: {
                datetime: (!calendar[1]?.length ? undefined : setHours(Sugar.Date.create(calendar[1]), 0, 0, 0, 0)) || getMinDate(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                datetime: (!calendar[2]?.length ? undefined : setHours(Sugar.Date.create(calendar[2]), 23, 59, 59, 999)) || getMaxDate(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        }
        todoString = todoString.replace(calendar_regex, '');
    }

    return {
        name: {type: {"unigraph.id": "$/schema/markdown"}, _value: todoString},
        done: false,
        priority: priority_num,
        children: tags.map(tagName => {return {"type": {"unigraph.id": "$/schema/interface/semantic"},
            "_value": {
                "type": {"unigraph.id": "$/schema/tag"},
                name: tagName
            }}
        }),
        time_frame
    }
}