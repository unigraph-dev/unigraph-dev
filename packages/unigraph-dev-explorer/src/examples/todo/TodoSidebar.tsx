import {
    mdiBookOpenOutline,
    mdiCalendarAlert,
    mdiCalendarOutline,
    mdiInboxOutline,
    mdiTagOffOutline,
    mdiTagOutline,
} from '@mdi/js';
import Icon from '@mdi/react';
import { Drawer, ListItemText, ListSubheader } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import _, { curry } from 'lodash/fp';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { pointerHoverSx, TabContext } from '../../utils';
import { TodoAll, TodoInbox, TodoToday, TodoUntagged, TodoUpcoming } from './TodoDefaultViews';
import { TodoTagView } from './TodoTagView';
import {
    filters,
    getAllTodoCountFromRes,
    getAllTodoCountQuery,
    getTaggedTodoCountFromRes,
    getTaggedTodoCountQuery,
    getTodayTodoCountFromRes,
    getTodayTodoCountQuery,
    getTodoInboxCountFromRes,
    getTodoInboxCountQuery,
    getUntaggedTodoCountFromRes,
    getUntaggedTodoCountQuery,
    getUpcomingTodoCountFromRes,
    getUpcomingTodoCountQuery,
} from './utils';

type TodoMenuItem = {
    iconPath: string | undefined;
    text: string;
    component: React.FC;
    tag?: any;
    getCountQuery?: (() => string | undefined) | undefined;
    getCountFromRes?: ((res: any) => number) | undefined;
};
export type TodoMenuItems = {
    [key: string]: TodoMenuItem;
};

const maketodoMenuItemFromTag = (tag: any): TodoMenuItem => {
    const tagName = tag.get('name').as('primitive');
    return {
        iconPath: mdiTagOutline,
        text: tagName,
        tag,
        component: (props: any) => {
            console.log('TodoTagView', { tag, props, name: tagName });
            return <TodoTagView data={tag} {...props} initialTab="$/schema/todo" />;
        },
        getCountQuery: () => getTaggedTodoCountQuery(tag.uid),
        getCountFromRes: getTaggedTodoCountFromRes,
    };
};

const maketodoMenuItemsFromTag = (tag: any): TodoMenuItems | undefined => {
    const tagName = tag.get('name').as('primitive');
    return {
        [tagName]: maketodoMenuItemFromTag(tag),
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
    untagged: {
        iconPath: mdiTagOffOutline,
        text: 'Untagged',
        component: TodoUntagged,
        getCountQuery: getUntaggedTodoCountQuery,
        getCountFromRes: getUntaggedTodoCountFromRes,
    },
};

const useCount = (query: string | undefined, getCountFromRes: any | undefined) => {
    const tabContext = React.useContext(TabContext);
    const [itemCount, setItemCount] = React.useState<number | undefined>(undefined);

    useEffectOnce(() => {
        if (query) {
            const subsId = getRandomInt();
            tabContext.subscribeToQuery(
                query,
                (results: any[]) => {
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
    return itemCount;
};
const useTagCount = (tag: any) => {
    return useCount(getTaggedTodoCountQuery(tag.uid), getTaggedTodoCountFromRes);
};

const TodoMenuSidebarItem = ({ iconPath, text, onClick, selected, itemCount, notDefaultView }: any) => {
    const tabContext = React.useContext(TabContext);
    // const itemCount = useCount(getCountQuery ? getCountQuery() : undefined, getCountFromRes);

    return (
        <ListItem sx={!notDefaultView ? pointerHoverSx : {}} onClick={onClick} selected={selected}>
            <ListItemIcon>{iconPath && <Icon path={iconPath as string} size={1} />}</ListItemIcon>
            <ListItemText primary={text} />
            {typeof itemCount === 'number' && itemCount > 0 && (
                <ListItemText primary={itemCount} sx={{ textAlign: 'right', marginLeft: '8px' }} />
            )}
        </ListItem>
    );
};
const useTags = () => {
    const [tags, setTags] = React.useState<any>([]);
    const tabContext = React.useContext(TabContext);
    const setValidTags = React.useCallback(
        (result: any) => {
            const tagsWithNames = result.filter((tag: any) => tag?.get('name'));
            setTags(tagsWithNames);
        },
        [setTags],
    );

    useEffectOnce(() => {
        // Subscribe to tags in general
        const subsId = getRandomInt();

        tabContext.subscribeToType('$/schema/tag', setValidTags, subsId, {
            queryAs: `{
            _value {
                name {
                    <_value.%>
                }
            }
            type { <unigraph.id> }
            uid
            <unigraph.origin> @filter(NOT eq(<_hide>, true)) {
                type @filter(eq(<unigraph.id>, "$/schema/todo")) {
                    uid
                }
            }
        }`,
        });

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    });
    return tags;
};

const useArchivedTags = () => {
    const [tags, setTags] = React.useState<any>([]);
    const tabContext = React.useContext(TabContext);
    const setValidArchivedTags = React.useCallback(
        (result: any) => {
            const listContents = result.get('children')?.['_value['] || [];
            const archivedTodoTagObjs = listContents
                .map((x: any) => new UnigraphObject(x?._value?._value))
                .filter((x: any) => x.getType('$/schema/tag'));
            setTags(archivedTodoTagObjs);
        },
        [setTags],
    );

    useEffectOnce(() => {
        // Subscribe to archived tags
        // Not super efficient, ideally we'd query tags while filter for backlinks to $/entity/todo_archived_tags
        const subsId = getRandomInt();
        tabContext.subscribeToObject('$/entity/todo_archived_tags', setValidArchivedTags, subsId);
        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    });
    return tags;
};

const TodoMenuSidebarDefaultView = (mode: string, setMode: any, todoViews: any, key: string) => {
    const { getCountQuery, getCountFromRes } = todoViews[key];
    const itemCount = useCount(getCountQuery ? getCountQuery() : undefined, getCountFromRes);
    return (
        <TodoMenuSidebarItem
            {...todoViews[key]}
            onClick={() => setMode(key)}
            selected={key === mode}
            notDefaultView={false}
            itemCount={itemCount}
        />
    );
};

const TodoMenuSidebarTagView = (mode: string, setMode: any, { data }: any) => {
    const itemCount = useTagCount(data);
    const itemData = maketodoMenuItemFromTag(data);
    return (
        <TodoMenuSidebarItem
            {...itemData}
            onClick={() => setMode(itemData.text)}
            selected={itemData.text === mode}
            notDefaultView
            itemCount={itemCount}
        />
    );
};
export const TodoMenuSidebar = ({ mode, setMode, todoViews, setTodoViews, todoListProps }: any) => {
    // basically the same as todoViews but grouped by sections
    const tags = useTags();
    const archivedTags = useArchivedTags();
    const [todoMenuItems, setTodoMenuItems] = React.useState<{ [key: string]: TodoMenuItems }>(() => {
        return { defaultViews: todoDefaultMenuItems };
    });
    const [archiveExpand, setArchiveExpand] = React.useState<boolean>(false);
    const tabContext = React.useContext(TabContext);

    useEffect(() => {
        const todoTags = tags
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
        console.log({ todoMenuItems, tags, archivedTags });
    }, [tags, setTodoViews, setTodoMenuItems]);

    useEffect(() => {
        const archivedTodoTags = archivedTags
            .map(maketodoMenuItemsFromTag)
            .filter(Boolean)
            .reduce((acc: TodoMenuItems, newVal: TodoMenuItems) => {
                return { ...acc, ...newVal };
            }, {});
        setTodoViews((currentViews: TodoMenuItems) => {
            return { ...currentViews, ...archivedTodoTags };
        });
        setTodoMenuItems((currentMenuItems: { [key: string]: TodoMenuItems }) => {
            return { ...currentMenuItems, archivedTags: { ...archivedTodoTags } };
        });
        console.log({ todoMenuItems, tags, archivedTags });
    }, [archivedTags, setTodoViews, setTodoMenuItems]);

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
                {_.keys(todoMenuItems.defaultViews).map((key) =>
                    TodoMenuSidebarDefaultView(mode, setMode, todoViews, key),
                )}
                <ListSubheader component="div" id="subheader-home">
                    {' '}
                    Tags{' '}
                </ListSubheader>
                {/* {_.keys(todoMenuItems.tags)
                    .sort()
                    .filter((key) => !_.keys(todoMenuItems.archivedTags).includes(key))
                    .map(renderMenuItem)} */}
                <DynamicObjectListView
                    items={tags
                        .filter(
                            (tag: any) => !_.keys(todoMenuItems.archivedTags).includes(tag.get('name').as('primitive')),
                        )
                        .sort((a: any, b: any) => {
                            return a.get('name')?.as('primitive') < b.get('name')?.as('primitive') ? 1 : -1;
                        })}
                    context={null}
                    noDrop
                    noBar
                    loadAll
                    compact
                    filters={[
                        ...filters,
                        {
                            id: 'only-with-todo',
                            fn: (obj: any) => {
                                return obj?.['unigraph.origin']?.length > 0;
                            },
                        },
                    ]}
                    defaultFilter="only-with-todo"
                    itemStyle={{ margin: '0px', padding: '0px' }}
                    style={{ height: 'auto' }}
                    components={{
                        '$/schema/tag': {
                            view: (tag: any) => TodoMenuSidebarTagView(mode, setMode, tag),
                            // query: noteQueryDetailed,
                            options: {
                                noClickthrough: true,
                                noSubentities: true,
                                // noContextMenu: true,
                                noBacklinks: true,
                            },
                        },
                    }}
                />
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
                {archiveExpand && (
                    <DynamicObjectListView
                        items={archivedTags}
                        context={null}
                        noDrop
                        noBar
                        loadAll
                        compact
                        style={{ height: 'auto' }}
                        components={{
                            '$/schema/tag': {
                                view: (tag: any) => TodoMenuSidebarTagView(mode, setMode, tag),
                                // query: noteQueryDetailed,
                                options: {
                                    noClickthrough: true,
                                    noSubentities: true,
                                    // noContextMenu: true,
                                    noBacklinks: true,
                                },
                            },
                        }}
                    />
                )}
                {/* {archiveExpand && _.keys(todoMenuItems.archivedTags).sort().map(renderMenuItem)} */}
            </List>
        </Drawer>
    );
};
