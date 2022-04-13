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
    Autocomplete,
    Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ExpandMore, ClearAll, InboxOutlined, ExpandLess } from '@mui/icons-material';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import InfiniteScroll from 'react-infinite-scroll-component';
import { byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';
import { TransitionGroup } from 'react-transition-group';
import { getDynamicViews } from '../../unigraph-react';
import { AutoDynamicView } from './AutoDynamicView';
import { DataContext, DataContextWrapper, hoverSx, isMobile, TabContext, trivialTypes } from '../../utils';
import { setupInfiniteScrolling } from './infiniteScrolling';
import { DragandDrop } from './DragandDrop';

const PREFIX = 'DynamicObjectListView';

const classes = {
    content: `${PREFIX}-content`,
};

const Root = styled('div')(({ theme }) => ({
    [`& .${classes.content}`]: {
        width: '100%',
        overflow: 'auto',
        marginRight: '8px',
    },
}));

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
    itemStyle,
    viewOptions,
    noHoverHighlight,
}: any) {
    const [itemHovered, setItemHovered] = React.useState<boolean>(false);
    const isRemoverActive = React.useCallback(() => {
        return !(itemRemover === _.noop || isMobile() || noRemover);
    }, [itemRemover, noRemover]);
    return (
        <ListItem
            sx={noHoverHighlight ? {} : hoverSx}
            style={{
                ...(compact ? { paddingTop: '2px', paddingBottom: '2px' } : {}),
                ...itemStyle,
            }}
            onMouseOver={() => setItemHovered(true)}
            onMouseLeave={() => setItemHovered(false)}
        >
            <AutoDynamicView
                options={{ ...(typeof viewOptions === 'function' ? viewOptions(item) : viewOptions), compact }}
                object={new UnigraphObject(item)}
                components={components}
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
            {isRemoverActive() && (
                <ListItemIcon
                    onClick={() => {
                        itemRemover([item.uid]);
                    }}
                    sx={{
                        cursor: 'pointer',
                        minWidth: 'auto',
                        padding: '5px',
                        borderRadius: '50%',
                        display: itemHovered ? '' : 'none',
                        '&:hover': {
                            display: '',
                            backgroundColor: 'action.selected',
                        },
                        '&:active': { backgroundColor: 'action.active' },
                    }}
                >
                    <ClearAll />
                </ListItemIcon>
            )}
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
    groupers?: any;
    noBar?: boolean;
    noRemover?: boolean;
    noDrop?: boolean;
    compact?: boolean;
    itemStyle?: any;
    subscribeOptions?: any;
    titleBar?: any;
    loadAll?: boolean;
    removeOnEnter?: boolean;
    style?: any;
    components?: any;
    initialTab?: string;
    viewOptions?: any;
    noHoverHighlight?: boolean;
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
    itemStyle,
    viewOptions,
    noHoverHighlight,
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
                    itemStyle={itemStyle}
                    callbacks={callbacks}
                    itemUids={items.map((ell: any) => itemGetter(ell).uid)}
                    itemRemover={itemRemover}
                    reverse={reverse}
                    noRemover={noRemover}
                    removeOnEnter={removeOnEnter}
                    components={components}
                    viewOptions={viewOptions}
                    noHoverHighlight={noHoverHighlight}
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
    parId,
    noRemover,
    compact,
    subscribeOptions,
    removeOnEnter,
    components,
    itemStyle,
    viewOptions,
    noHoverHighlight,
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
                    setLoadedItems(its);
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
    }, [JSON.stringify(items.map((el: any) => itemGetter(el).uid).sort())]);

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
                        itemStyle={itemStyle}
                        callbacks={callbacks}
                        itemUids={items.map((ell: any) => itemGetter(ell).uid)}
                        itemRemover={itemRemover}
                        noRemover={noRemover}
                        removeOnEnter={removeOnEnter}
                        components={components}
                        viewOptions={viewOptions}
                        noHoverHighlight={noHoverHighlight}
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
            <Divider
                variant="middle"
                orientation="vertical"
                sx={{
                    height: 'auto',
                    marginLeft: '16px',
                    marginRight: '16px',
                    marginTop: '0px',
                    marginBottom: '0px',
                }}
            />
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

export function TabButton({ children, isSelected, onClick, sx }: any) {
    return (
        <Box
            style={{
                cursor: 'pointer',
                display: 'flex',
                padding: '4px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '8px',
                ...(isSelected ? { backgroundColor: '#E9E9E9', borderRadius: '8px' } : {}),
            }}
            sx={sx}
            onClick={onClick}
        >
            {children}
        </Box>
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
    noBar,
    noRemover,
    noDrop,
    compact,
    itemStyle,
    subscribeOptions,
    loadAll,
    removeOnEnter,
    components,
    itemAdder,
    initialTab,
    viewOptions,
    noHoverHighlight,
}) => {
    const tabContext = React.useContext(TabContext);

    const [optionsOpen, setOptionsOpen] = React.useState(false);
    let setGroupBy: any;
    [groupBy, setGroupBy] = React.useState(groupBy || '');
    groupers = { ...groupers, ...groupersDefault };
    const [reverseOrder, setReverseOrder] = React.useState(reverse || false);
    const [currentTab, setCurrentTab] = React.useState(initialTab || '');

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
            fn: (obj) => (trivialTypes.includes(obj?.type?.['unigraph.id']) ? null : obj),
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
        if (allItems.length === 0) setCurrentTab(initialTab || '');
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
            if (!monitor.didDrop() && !noDrop && (contextRef.current || itemAdder)) {
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
        <Root
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
            <DataContextWrapper contextUid={context?.uid} contextData={context} parents={[]} expandedChildren>
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
                                    expandIcon={React.createElement(optionsOpen ? ExpandLess : ExpandMore, {
                                        onClick: () => setOptionsOpen(!optionsOpen),
                                        sx: {
                                            cursor: 'pointer',
                                            borderRadius: '16px',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5',
                                            },
                                        },
                                    })}
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
                                {optionsOpen ? (
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
                                                        <TextField
                                                            {...params}
                                                            label="Filter presets"
                                                            variant="outlined"
                                                        />
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
                                ) : (
                                    []
                                )}
                            </Accordion>
                            <IconButton
                                onClick={() => itemRemover(procItems.map((el, idx) => itemGetter(el).uid))}
                                style={{
                                    display: itemRemover === _.noop ? 'none' : '',
                                }}
                                size="large"
                            >
                                <ClearAll />
                            </IconButton>
                            <IconButton
                                style={{
                                    display: canDrop && ((!noDrop && contextRef.current) || itemAdder) ? '' : 'none',
                                }}
                                size="large"
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
                              parId,
                              noRemover,
                              compact,
                              itemStyle,
                              subscribeOptions,
                              removeOnEnter,
                              components,
                              viewOptions,
                              noHoverHighlight,
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
                                      parId,
                                      noRemover,
                                      compact,
                                      itemStyle,
                                      subscribeOptions,
                                      removeOnEnter,
                                      components,
                                      viewOptions,
                                      noHoverHighlight,
                                  })}
                              </>
                          ))}
                </div>
            </DataContextWrapper>
        </Root>
    );
};
