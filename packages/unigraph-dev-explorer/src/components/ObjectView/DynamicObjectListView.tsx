import {
    Accordion,
    AccordionSummary,
    Typography,
    AccordionDetails,
    List,
    ListItem,
    Select,
    MenuItem,
    IconButton,
    ListItemIcon,
    ListSubheader,
    FormControlLabel,
    Switch,
    Button,
    TextField,
    Slide,
    Divider,
    makeStyles,
} from '@material-ui/core';
import { ExpandMore, ClearAll, InboxOutlined } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import _ from 'lodash';
import React from 'react';
import { useDrop } from 'react-dnd';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { buildGraph as buildGraphFn, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import InfiniteScroll from 'react-infinite-scroll-component';
import { byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';
import { TransitionGroup } from 'react-transition-group';
import { getDynamicViews } from '../../unigraph-react';
import { AutoDynamicView } from './AutoDynamicView';
import { DataContext, DataContextWrapper, isMobile, TabContext } from '../../utils';
import { setupInfiniteScrolling } from './infiniteScrolling';
import { DragandDrop } from './DragandDrop';

type Group = {
    name: string;
    items: any[];
};

type Grouper = (el: any[]) => Group[];

const groupersDefault: Record<string, Grouper> = {
    date: (el: any[]) => {
        const groupsMap: any = {
            Today: [],
            'Last week': [],
            'Last month': [],
            Earlier: [],
        };
        el.forEach((it) => {
            if (it && it._updatedAt) {
                const day = new Date(it._updatedAt);
                const now = new Date();
                if (now.getTime() - day.getTime() <= 1000 * 60 * 60 * 24) {
                    groupsMap.Today.push(it);
                } else if (now.getTime() - day.getTime() <= 1000 * 60 * 60 * 24 * 7) {
                    groupsMap['Last week'].push(it);
                } else if (now.getTime() - day.getTime() <= 1000 * 60 * 60 * 24 * 31) {
                    groupsMap['Last month'].push(it);
                } else {
                    groupsMap.Earlier.push(it);
                }
            } else {
                groupsMap.Earlier.push(it);
            }
        });
        return Object.entries(groupsMap).map(([k, v]) => ({
            name: k,
            items: v as any[],
        }));
    },
    type: (el: any[]) => {
        const groupsMap: any = {};
        el.forEach((it) => {
            const type = it?.type?.['unigraph.id'] || 'Other';
            if (groupsMap[type]) {
                groupsMap[type].push(it);
            } else {
                groupsMap[type] = [it];
            }
        });
        return Object.entries(groupsMap)
            .map(([k, v]) => ({ name: k, items: v as any[] }))
            .sort((a, b) => (a.name > b.name ? 1 : -1));
    },
};

function DynamicListItem({
    reverse,
    listUid,
    item,
    index,
    context,
    callbacks,
    itemUids,
    itemRemover,
    noRemover,
    components,
    removeOnEnter,
    compact,
}: any) {
    return (
        <ListItem
            style={{
                ...(compact ? { paddingTop: '2px', paddingBottom: '2px' } : {}),
            }}
        >
            <ListItemIcon
                onClick={() => {
                    itemRemover([item.uid]);
                }}
                style={{
                    display: itemRemover === _.noop || isMobile() || noRemover ? 'none' : '',
                }}
            >
                <ClearAll />
            </ListItemIcon>
            <AutoDynamicView
                compact={compact}
                object={new UnigraphObject(item)}
                components={components}
                withParent={!!listUid}
                callbacks={{
                    ...callbacks,
                    context,
                    removeOnEnter,
                    removeFromContext: (where: undefined | 'left' | 'right') => {
                        const uids = {
                            left: itemUids.slice(0, index),
                            right: undefined,
                            '': undefined,
                        }[where || ''] || [item.uid];
                        itemRemover(uids);
                    },
                }}
            />
        </ListItem>
    );
}

export type ItemRemover = (uids: string[]) => void;
export type Filter = { id: string; fn: (it: any) => boolean };

export type DynamicObjectListViewProps = {
    items: any[];
    listUid?: string;
    context: any;
    callbacks?: any;
    itemGetter?: any;
    itemRemover?: ItemRemover;
    itemAdder?: (uid: string) => void;
    filters?: Filter[];
    defaultFilter?: string | string[];
    reverse?: boolean;
    virtualized?: boolean;
    groupBy?: string;
    buildGraph?: boolean;
    groupers?: any;
    noBar?: boolean;
    noRemover?: boolean;
    noDrop?: boolean;
    compact?: boolean;
    subscribeOptions?: any;
    titleBar?: any;
    loadAll?: boolean;
    removeOnEnter?: boolean;
    style?: any;
    components?: any;
};

function DynamicListBasic({
    reverse,
    items,
    context,
    listUid,
    callbacks,
    itemUids,
    itemRemover,
    itemGetter,
    infinite = true,
    noRemover,
    compact,
    removeOnEnter,
    components,
}: any) {
    const tabContext = React.useContext(TabContext);
    return (
        <DragandDrop
            dndContext={tabContext.viewId}
            listId={context?.uid}
            isReverse={reverse}
            arrayId={listUid}
            Comp={TransitionGroup}
            ChildrenComp={Slide}
        >
            {items.map((el: any, index: number) => (
                <DynamicListItem
                    key={itemGetter(el)?.uid}
                    item={itemGetter(el)}
                    index={index}
                    context={context}
                    listUid={listUid}
                    compact={compact}
                    callbacks={callbacks}
                    itemUids={items.map((ell: any) => itemGetter(ell).uid)}
                    itemRemover={itemRemover}
                    reverse={reverse}
                    noRemover={noRemover}
                    removeOnEnter={removeOnEnter}
                    components={components}
                />
            ))}
        </DragandDrop>
    );
}

function DynamicList({
    reverse,
    items,
    context,
    listUid,
    callbacks,
    itemUids,
    itemRemover,
    itemGetter,
    infinite = true,
    buildGraph,
    parId,
    noRemover,
    compact,
    subscribeOptions,
    removeOnEnter,
    components,
}: any) {
    const tabContext = React.useContext(TabContext);
    const [loadedItems, setLoadedItems] = React.useState<any[]>([]);
    const [setupProps, setSetupProps] = React.useState<{
        next: any;
        cleanup: any;
        onUpdate: any;
    } | null>(null);
    const scrollerRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (setupProps?.cleanup) setupProps.cleanup();
        let newProps: any;
        if (items.length) {
            newProps = setupInfiniteScrolling(
                items.map((el: any) => itemGetter(el).uid),
                infinite ? 15 : items.length,
                (its: any[]) => {
                    setLoadedItems(buildGraph ? buildGraphFn(its) : its);
                },
                tabContext,
                subscribeOptions,
            );
            setSetupProps(newProps);
        } else {
            setLoadedItems([]);
        }
        return function cleanup() {
            newProps?.cleanup();
        };
    }, [items.length === 0]);

    React.useEffect(() => {
        // eslint-disable-next-line max-len
        requestAnimationFrame(() => {
            if (
                scrollerRef.current?._infScroll?.scrollHeight < scrollerRef.current?.el?.clientHeight &&
                loadedItems.length < items.length
            ) {
                setupProps?.next();
            }
        });
    }, [loadedItems.length]);

    React.useEffect(() => {
        setupProps?.onUpdate(items.map((el: any) => itemGetter(el).uid));
    }, [items.map((el: any) => itemGetter(el).uid)]);

    return (
        <InfiniteScroll
            dataLength={loadedItems.length}
            next={setupProps?.next || (() => undefined)}
            hasMore={loadedItems.length < items.length}
            loader=""
            scrollableTarget={`scrollableDiv${parId}`}
            endMessage=""
            ref={scrollerRef}
        >
            <DragandDrop
                Comp={TransitionGroup}
                dndContext={tabContext.viewId}
                listId={context?.uid}
                isReverse={reverse}
                arrayId={listUid}
                ChildrenComp={Slide}
            >
                {loadedItems.map((el: any, index: number) => (
                    <DynamicListItem
                        key={el?.uid || index}
                        item={el}
                        index={index}
                        context={context}
                        listUid={listUid}
                        reverse={reverse}
                        compact={compact}
                        callbacks={callbacks}
                        itemUids={items.map((ell: any) => itemGetter(ell).uid)}
                        itemRemover={itemRemover}
                        noRemover={noRemover}
                        removeOnEnter={removeOnEnter}
                        components={components}
                    />
                ))}
            </DragandDrop>
        </InfiniteScroll>
    );
}

function MultiTypeDescriptor({
    items,
    selectedTab,
    setSelectedTab,
}: {
    items: any[];
    selectedTab: string;
    setSelectedTab: any;
}) {
    const itemGroups = groupersDefault.type(items);

    return itemGroups.length > 1 ? (
        <>
            <Divider variant="middle" orientation="vertical" style={{ height: 'auto' }} />
            <div style={{ whiteSpace: 'nowrap', display: 'flex' }}>
                {itemGroups.map((el, index) => (
                    <TabButton isSelected={selectedTab === el.name} onClick={() => setSelectedTab(el.name)}>
                        <div
                            style={{
                                minHeight: '18px',
                                minWidth: '18px',
                                height: '18px',
                                width: '18px',
                                alignSelf: 'center',
                                marginRight: '3px',
                                opacity: 0.54,
                                backgroundImage: `url("data:image/svg+xml,${
                                    window.unigraph.getNamespaceMap?.()?.[el.name]?._icon
                                }")`,
                            }}
                        />
                        <Typography style={{ color: 'grey', marginRight: '4px' }}>
                            {window.unigraph.getNamespaceMap?.()?.[el.name]?._name}:
                        </Typography>
                        <Typography style={{ marginRight: '8px' }}>{el.items.length}</Typography>
                    </TabButton>
                ))}
            </div>
        </>
    ) : (
        <span />
    );
}

const useStyles = makeStyles((theme) => ({
    content: {
        width: '100%',
        overflow: 'auto',
    },
}));

export function TabButton({ children, isSelected, onClick }: any) {
    return (
        <div
            style={{
                cursor: 'pointer',
                display: 'flex',
                padding: '4px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '8px',
                ...(isSelected ? { backgroundColor: '#E9E9E9', borderRadius: '8px' } : {}),
            }}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

/**
 * Component for a list of objects with various functionalities.
 *
 * items: UnigraphObject[] The list of items to display
 * listUid: the UID of the list object (optional), used for deleting items from list
 *
 * @param param0
 * @returns
 */
export const DynamicObjectListView: React.FC<DynamicObjectListViewProps> = ({
    style,
    titleBar,
    items,
    groupers,
    groupBy,
    listUid,
    context,
    callbacks,
    itemGetter = _.identity,
    itemRemover = _.noop,
    filters = [],
    defaultFilter,
    reverse,
    virtualized,
    buildGraph,
    noBar,
    noRemover,
    noDrop,
    compact,
    subscribeOptions,
    loadAll,
    removeOnEnter,
    components,
    itemAdder,
}) => {
    const classes = useStyles();

    const tabContext = React.useContext(TabContext);

    const [optionsOpen, setOptionsOpen] = React.useState(false);
    let setGroupBy: any;
    [groupBy, setGroupBy] = React.useState(groupBy || '');
    groupers = { ...groupers, ...groupersDefault };
    const [reverseOrder, setReverseOrder] = React.useState(reverse || false);
    const [currentTab, setCurrentTab] = React.useState('');

    const isStub =
        !items[0] ||
        Object.keys(itemGetter(items[0])).filter((el) => el.startsWith('_value')).length < 1 ||
        items[0]._stub;

    const totalFilters: Filter[] = [
        { id: 'no-filter', fn: () => true },
        {
            id: 'no-deleted',
            fn: (obj) => (obj?.['dgraph.type']?.includes?.('Deleted') ? null : obj),
        },
        {
            id: 'no-noview',
            fn: (obj) => (getDynamicViews().includes(obj?.type?.['unigraph.id']) ? obj : null),
        },
        {
            id: 'no-trivial',
            fn: (obj) =>
                ['$/schema/markdown', '$/schema/subentity'].includes(obj?.type?.['unigraph.id']) ? null : obj,
        },
        { id: 'no-hidden', fn: (obj) => obj._hide !== true },
        ...filters,
    ];

    const [filtersUsed, setFiltersUsed] = React.useState([
        // eslint-disable-next-line no-nested-ternary
        ...(defaultFilter
            ? Array.isArray(defaultFilter)
                ? defaultFilter
                : [defaultFilter]
            : ['no-noview', 'no-deleted', 'no-trivial', 'no-hidden']),
    ]);

    const [totalItems, setTotalItems] = React.useState<any[]>([]);
    const [procItems, setProcItems] = React.useState<any[]>([]);
    React.useEffect(() => {
        let allItems: any[] = [];
        const currItems = [...items].sort(byElementIndex);
        if (reverseOrder) allItems = [...currItems].reverse();
        else allItems = [...currItems];
        filtersUsed.forEach((el) => {
            const filter = totalFilters.find((flt) => flt.id === el);
            allItems = allItems.filter((it: any) => (filter?.fn || (() => true))(itemGetter(it)));
        });
        setTotalItems([...allItems]);
        if (currentTab.length >= 1)
            allItems = allItems.filter((it: any) => itemGetter(it).type['unigraph.id'] === currentTab);
        setProcItems(allItems);
        if (allItems.length === 0) setCurrentTab('');
    }, [reverseOrder, items, filtersUsed, currentTab]);

    const contextRef = React.useRef(context);
    // eslint-disable-next-line no-return-assign
    React.useEffect(() => (contextRef.current = context), [context]);
    const [parId] = React.useState(getRandomInt());
    const [dndContext] = React.useState(tabContext.viewId || parId);

    const [{ canDrop }, drop] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: { uid: string; dndContext: any; removeFromContext?: any }, monitor) => {
            if (!monitor.didDrop() && !noDrop && contextRef.current) {
                if (itemAdder) {
                    itemAdder(item.uid);
                } else {
                    window.unigraph.runExecutable('$/executable/add-item-to-list', {
                        where: contextRef.current.uid,
                        item: item.uid,
                    });
                }
                if (tabContext.viewId === item.dndContext) {
                    item?.removeFromContext();
                }
                // console.log(tabContext, item.dndContext)
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'hidden',
                minHeight: canDrop && !noDrop ? '200px' : '',
                ...(style || {}),
            }}
            ref={drop}
        >
            <DataContextWrapper contextUid={context?.uid} contextData={context} parents={[]}>
                <div style={{ display: 'flex' }}>
                    {noBar ? (
                        []
                    ) : (
                        <>
                            <Accordion
                                expanded={optionsOpen}
                                variant="outlined"
                                style={{
                                    flexGrow: 1,
                                    minWidth: 0,
                                    margin: '8px',
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMore onClick={() => setOptionsOpen(!optionsOpen)} />}
                                    aria-controls="panel1bh-content"
                                    id="panel1bh-header"
                                    classes={{ content: classes.content }}
                                    style={{ cursor: 'initial' }}
                                >
                                    <TabButton
                                        isSelected={
                                            currentTab === '' &&
                                            groupersDefault.type?.(totalItems.map(itemGetter))?.length > 1
                                        }
                                        onClick={() => {
                                            setCurrentTab('');
                                        }}
                                    >
                                        <Typography style={{ whiteSpace: 'nowrap' }}>
                                            {totalItems.length}
                                            {titleBar || ' items'}
                                        </Typography>
                                    </TabButton>
                                    <MultiTypeDescriptor
                                        items={totalItems.map(itemGetter)}
                                        selectedTab={currentTab}
                                        setSelectedTab={setCurrentTab}
                                    />
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List>
                                        <ListItem>
                                            <Typography>Group items by</Typography>
                                            <Select
                                                value={groupBy}
                                                onChange={(ev) => {
                                                    setGroupBy(ev.target.value as string);
                                                }}
                                                style={{ marginLeft: '24px' }}
                                                displayEmpty
                                            >
                                                <MenuItem value="">None</MenuItem>
                                                {Object.keys(groupers).map((el) => (
                                                    <MenuItem value={el}>{el}</MenuItem>
                                                ))}
                                            </Select>
                                        </ListItem>
                                        <ListItem>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={reverseOrder}
                                                        onChange={() => setReverseOrder(!reverseOrder)}
                                                        name="moveToInbox"
                                                    />
                                                }
                                                label="Latest items on top"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <Autocomplete
                                                multiple
                                                value={filtersUsed}
                                                onChange={(event, newValue) => {
                                                    setFiltersUsed(newValue);
                                                }}
                                                id="filter-selector"
                                                options={totalFilters.map((el) => el.id)}
                                                style={{ width: 300 }}
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Filter presets" variant="outlined" />
                                                )}
                                            />
                                        </ListItem>
                                        <ListItem
                                            style={{
                                                display: context?.uid && !noRemover ? '' : 'none',
                                            }}
                                        >
                                            <Button
                                                onClick={() => {
                                                    window.wsnavigator(`/graph?uid=${context.uid}`);
                                                }}
                                            >
                                                Show Graph view
                                            </Button>
                                        </ListItem>
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                            <IconButton
                                onClick={() => itemRemover(procItems.map((el, idx) => itemGetter(el).uid))}
                                style={{
                                    display: itemRemover === _.noop ? 'none' : '',
                                }}
                            >
                                <ClearAll />
                            </IconButton>
                            <IconButton
                                style={{
                                    display: canDrop && !noDrop && contextRef.current ? '' : 'none',
                                }}
                            >
                                <InboxOutlined />
                            </IconButton>
                        </>
                    )}
                </div>
                <div style={{ flexGrow: 1, overflowY: 'auto' }} id={`scrollableDiv${parId}`}>
                    {!groupBy.length
                        ? React.createElement(isStub && !loadAll ? DynamicList : DynamicListBasic, {
                              reverse: reverseOrder,
                              items: procItems,
                              context,
                              listUid,
                              callbacks,
                              itemRemover,
                              itemUids: procItems.map((el) => el.uid),
                              itemGetter,
                              buildGraph,
                              parId,
                              noRemover,
                              compact,
                              subscribeOptions,
                              removeOnEnter,
                              components,
                          })
                        : groupers[groupBy](procItems.map(itemGetter)).map((el: Group) => (
                              <>
                                  <ListSubheader
                                      style={{
                                          padding: compact ? '2px' : '',
                                          lineHeight: compact ? '1.2em' : '',
                                      }}
                                  >
                                      {el.name}
                                  </ListSubheader>
                                  {React.createElement(isStub && !loadAll ? DynamicList : DynamicListBasic, {
                                      reverse: reverseOrder,
                                      items: el.items,
                                      context,
                                      listUid,
                                      callbacks,
                                      itemRemover,
                                      itemUids: el.items.map((ell) => ell.uid),
                                      itemGetter: _.identity,
                                      infinite: false,
                                      buildGraph,
                                      parId,
                                      noRemover,
                                      compact,
                                      subscribeOptions,
                                      removeOnEnter,
                                      components,
                                  })}
                              </>
                          ))}
                </div>
            </DataContextWrapper>
        </div>
    );
};
