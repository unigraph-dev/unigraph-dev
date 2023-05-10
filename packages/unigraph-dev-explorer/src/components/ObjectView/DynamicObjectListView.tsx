import {
    Typography,
    ListItem,
    IconButton,
    ListItemIcon,
    ListSubheader,
    Slide,
    Divider,
    Box,
    Badge,
    BadgeProps,
    Chip,
    Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ClearAll, InboxOutlined } from '@mui/icons-material';
import _ from 'lodash';
import React from 'react';
import { useDrop } from 'react-dnd';
import { UnigraphObject, getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import InfiniteScroll from 'react-infinite-scroll-component';
import { byElementIndex } from 'unigraph-dev-common/lib/utils/entityUtils';
import {
    mdiArrowDown,
    mdiArrowUp,
    mdiFilterOutline,
    mdiViewListOutline,
    mdiFormatListBulletedType,
    mdiPlus,
    mdiTable,
} from '@mdi/js';
import Icon from '@mdi/react';
import { TransitionGroup } from 'react-transition-group';
import { SwipeableList, SwipeableListItem, ActionAnimations } from '@sandstreamdev/react-swipeable-list';
import { getDynamicViews } from '../../unigraph-react';
import { AutoDynamicView } from './AutoDynamicView';
import { DataContextWrapper, hoverSx, isMobile, TabContext, trivialTypes, tryHapticFeedback } from '../../utils';
import { setupInfiniteScrolling } from './infiniteScrolling';
import { DragandDrop } from './DragandDrop';
import '@sandstreamdev/react-swipeable-list/dist/styles.css';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';
import { DynamicObjectTableView } from './DynamicObjectTableView';
import { useIsInViewport } from '../../utils/useIsInViewport';

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
    autoRemove,
    listUid,
    parRef,
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
    removeItemsFromView,
    noHoverHighlight,
    scrollOver,
    componentRight,
    _swipableClassName,
    _swipableRest,
}: any) {
    const [itemHovered, setItemHovered] = React.useState<boolean>(false);
    const [swipeActionable, setSwipeActionable] = React.useState<boolean>(false);
    const isRemoverActive = React.useCallback(() => {
        return !(itemRemover === _.noop || noRemover);
    }, [itemRemover, noRemover]);
    const finalCallback = {
        ...callbacks,
        context,
        removeOnEnter,
        removeFromContext: (where: undefined | 'left' | 'right' | string[]) => {
            const uids = Array.isArray(where)
                ? where
                : {
                      left: itemUids.slice(0, index),
                      right: undefined,
                      '': undefined,
                  }[where || ''] || [item.uid];
            itemRemover(uids);
            removeItemsFromView(uids);
        },
    };

    const itemRef = React.useRef(null);
    const isScrolledOver = useIsInViewport(itemRef, parRef);
    const [hasScrolledOver, setHasScrolledOver] = React.useState(false);
    React.useEffect(() => {
        setHasScrolledOver(!!isScrolledOver);
    }, [isScrolledOver]);
    React.useEffect(() => {
        if (hasScrolledOver) scrollOver();
    }, [hasScrolledOver]);

    React.useEffect(() => {
        if (swipeActionable) {
            tryHapticFeedback();
        }
    }, [swipeActionable]);
    return (
        <ListItem
            ref={itemRef}
            className={_swipableClassName}
            sx={noHoverHighlight ? {} : hoverSx}
            style={{
                ...(compact ? { paddingTop: '2px', paddingBottom: '2px' } : {}),
                ...(hasScrolledOver && autoRemove ? { filter: 'opacity(50%)' } : {}),
                ...itemStyle,
            }}
            onMouseOver={() => setItemHovered(true)}
            onMouseLeave={() => setItemHovered(false)}
        >
            <SwipeableListItem
                swipeLeft={
                    isRemoverActive()
                        ? {
                              content: <div>Delete</div>,
                              action: () => {
                                  itemRemover([item.uid]);
                                  removeItemsFromView([item.uid]);
                              },
                              actionAnimation: ActionAnimations.REMOVE,
                          }
                        : undefined
                }
                swipeRight={{
                    content: <div>Menu</div>,
                    action: () => {
                        onUnigraphContextMenu({ clientX: 0, clientY: 0 } as any, item, context, finalCallback);
                    },
                }}
                {..._swipableRest}
                blockSwipe={!isMobile()}
                threshold={0.33}
                onSwipeProgress={(percent) => setSwipeActionable(percent > 33)}
            >
                <AutoDynamicView
                    options={{
                        ...(typeof viewOptions === 'function' ? viewOptions(item) : viewOptions),
                        compact,
                        noSwipe: !isMobile(),
                    }}
                    object={new UnigraphObject(item)}
                    components={components}
                    callbacks={finalCallback}
                />
                {isRemoverActive() && !isMobile() ? (
                    <ListItemIcon
                        onClick={() => {
                            itemRemover([item.uid]);
                            removeItemsFromView([item.uid]);
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
                ) : null}
                {typeof componentRight === 'function' ? componentRight({ data: item, context }) : null}
            </SwipeableListItem>
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
    componentRight?: ({ data, callbacks }: any) => JSX.Element;
    noHoverHighlight?: boolean;
    inline?: boolean;
    autoRemove?: boolean;
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
    removeItemsFromView,
    noHoverHighlight,
    componentRight,
    _swipableClassName,
    _swipableRest,
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
                    componentRight={componentRight}
                    viewOptions={viewOptions}
                    removeItemsFromView={removeItemsFromView}
                    noHoverHighlight={noHoverHighlight}
                    _swipableClassName={_swipableClassName}
                    _swipableRest={_swipableRest}
                />
            ))}
        </DragandDrop>
    );
}

function DynamicList({
    autoRemove,
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
    componentRight,
    noHoverHighlight,
    removeItemsFromView,
    _swipableClassName,
    _swipableRest,
}: any) {
    const tabContext = React.useContext(TabContext);
    const [loadedItems, setLoadedItems] = React.useState<any[]>([]);
    const [setupProps, setSetupProps] = React.useState<{
        next: any;
        cleanup: any;
        onUpdate: any;
    } | null>(null);
    const scrollerRef = React.useRef<any>(null);
    const [scrollerHeight, setScrollerHeight] = React.useState(0);
    const observer = React.useMemo(
        () =>
            new ResizeObserver((entries: any) => {
                if (entries[0]) setScrollerHeight(entries[0].contentRect.height);
            }),
        [],
    );
    React.useEffect(() => {
        if (scrollerRef.current === null) return () => false;
        observer.observe(scrollerRef.current?.el);
        return () => {
            observer.disconnect();
        };
    }, [scrollerRef]);

    const [myItems, setMyItems] = React.useState([]);
    const newParRef = React.useRef(false);
    React.useEffect(() => {
        if (!autoRemove) setMyItems(items.map((el: any) => itemGetter(el).uid));
        else {
            const newItems = _.difference(
                items.map((el: any) => itemGetter(el).uid),
                myItems,
            );
            setMyItems([...newItems, ...myItems]);
        }
        newParRef.current = false;
    }, [autoRemove, JSON.stringify(items.map((el: any) => itemGetter(el).uid))]);

    React.useEffect(() => {
        if (setupProps?.cleanup) setupProps.cleanup();
        let newProps: any;
        if (myItems.length) {
            newProps = setupInfiniteScrolling(
                myItems,
                infinite ? 15 : myItems.length,
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
    }, [myItems.length === 0]);

    React.useEffect(() => {
        // eslint-disable-next-line max-len
        requestAnimationFrame(() => {
            if (
                scrollerRef.current?._infScroll?.scrollHeight < scrollerRef.current?.el?.clientHeight &&
                loadedItems.length < myItems.length
            ) {
                setupProps?.next();
            }
        });
    }, [loadedItems.length]);

    React.useEffect(() => {
        setupProps?.onUpdate(myItems);
    }, [JSON.stringify(myItems)]);

    const scrollOver = React.useCallback(
        (uid?: string) => {
            if (!autoRemove || !uid) return;
            itemRemover(uid);
        },
        [loadedItems, autoRemove],
    );

    return (
        <InfiniteScroll
            dataLength={loadedItems.length}
            next={setupProps?.next || (() => undefined)}
            hasMore={loadedItems.length < myItems.length}
            loader={
                <div className="lds-ellipsis" style={{ marginLeft: '16px' }}>
                    <div />
                    <div />
                    <div />
                    <div />
                </div>
            }
            scrollableTarget={`scrollableDiv${parId}`}
            endMessage={
                autoRemove ? (
                    <div style={{ height: scrollerHeight, textAlign: 'center', paddingTop: '16px' }}>
                        All caught up!
                    </div>
                ) : undefined
            }
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
                        itemUids={myItems}
                        itemRemover={itemRemover}
                        noRemover={noRemover}
                        parRef={scrollerRef}
                        removeOnEnter={removeOnEnter}
                        components={components}
                        viewOptions={viewOptions}
                        componentRight={componentRight}
                        removeItemsFromView={removeItemsFromView}
                        noHoverHighlight={noHoverHighlight}
                        _swipableClassName={_swipableClassName}
                        _swipableRest={_swipableRest}
                        autoRemove={autoRemove}
                        scrollOver={() => scrollOver(el?.uid)}
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

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: -3,
        top: 3,
        border: `2px solid ${theme.palette.background.paper}`,
        padding: '0 4px',
    },
}));

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
    autoRemove,
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
    compact = true,
    itemStyle,
    subscribeOptions,
    loadAll,
    removeOnEnter,
    components,
    componentRight,
    itemAdder,
    initialTab,
    viewOptions,
    inline,
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

    const removeItemsFromView = React.useCallback(
        (toRemove: string[]) => {
            setProcItems(procItems.filter((el) => !toRemove.includes(itemGetter(el)?.uid)));
        },
        [procItems, itemGetter],
    );

    const contextRef = React.useRef(context);
    // eslint-disable-next-line no-return-assign
    React.useEffect(() => (contextRef.current = context), [context]);
    const [parId] = React.useState(getRandomInt());
    const [dndContext] = React.useState(tabContext.viewId || parId);

    const [viewAs, setViewAs] = React.useState<'list' | 'table'>('list');

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
                {noBar ? (
                    []
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            minHeight: '50px',
                        }}
                    >
                        <Typography style={{ whiteSpace: 'nowrap', color: 'gray', fontSize: '15px' }}>
                            {procItems.length}
                            {titleBar || ' items'}
                        </Typography>
                        <Divider
                            variant="middle"
                            orientation="vertical"
                            flexItem
                            sx={{
                                height: 'auto',
                                marginLeft: '8px',
                                marginRight: '8px',
                            }}
                        />
                        <Stack direction="row" spacing={1}>
                            <Chip
                                icon={
                                    <StyledBadge badgeContent={4} color="primary" style={{ marginRight: '8px' }}>
                                        <Icon path={mdiFormatListBulletedType} size={0.75} />
                                    </StyledBadge>
                                }
                                label="Types"
                                variant="outlined"
                                size="small"
                            />
                            <Chip
                                onClick={() => setReverseOrder(!reverseOrder)}
                                icon={<Icon path={reverseOrder ? mdiArrowUp : mdiArrowDown} size={0.75} />}
                                label="Last Edited"
                                variant="outlined"
                                size="small"
                            />
                            <Chip
                                onClick={() => (viewAs === 'list' ? setViewAs('table') : setViewAs('list'))}
                                icon={<Icon path={viewAs === 'list' ? mdiViewListOutline : mdiTable} size={0.75} />}
                                label="View As"
                                variant="outlined"
                                size="small"
                            />
                        </Stack>
                        <Divider
                            variant="middle"
                            orientation="vertical"
                            flexItem
                            sx={{
                                height: 'auto',
                                marginLeft: '8px',
                                marginRight: '8px',
                            }}
                        />
                        <Icon path={mdiFilterOutline} size={0.75} style={{ marginRight: '4px' }} />
                        <Stack direction="row" spacing={1} style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex', color: 'gray' }}>
                                <Icon path={mdiPlus} size={0.75} />
                                <Typography style={{ marginLeft: '2px', fontSize: '14px' }}>Add filter</Typography>
                            </div>
                        </Stack>
                        <IconButton
                            onClick={() => itemRemover(procItems.map((el, idx) => itemGetter(el).uid))}
                            style={{
                                display: itemRemover === _.noop ? 'none' : '',
                            }}
                            size="small"
                        >
                            <ClearAll />
                        </IconButton>
                        <IconButton
                            style={{
                                display: canDrop && ((!noDrop && contextRef.current) || itemAdder) ? '' : 'none',
                            }}
                            size="small"
                        >
                            <InboxOutlined />
                        </IconButton>
                    </div>
                )}
                <div style={{ flexGrow: 1, overflowY: 'auto' }} id={`scrollableDiv${parId}`}>
                    {viewAs === 'list' ? (
                        <SwipeableList>
                            {({ className, ...rest }) =>
                                !(groupBy as any).length
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
                                          autoRemove,
                                          compact,
                                          itemStyle,
                                          subscribeOptions,
                                          removeOnEnter,
                                          components,
                                          componentRight,
                                          viewOptions,
                                          removeItemsFromView,
                                          noHoverHighlight,
                                          _swipableClassName: className,
                                          _swipableRest: rest,
                                      })
                                    : groupers[groupBy as any](procItems.map(itemGetter)).map((el: Group) => (
                                          <React.Fragment key={el.name}>
                                              <ListSubheader
                                                  style={{
                                                      padding: compact ? '2px' : '',
                                                      lineHeight: compact ? '1.2em' : '',
                                                  }}
                                              >
                                                  {el.name}
                                              </ListSubheader>
                                              {React.createElement(DynamicListBasic, {
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
                                                  componentRight,
                                                  viewOptions,
                                                  removeItemsFromView,
                                                  noHoverHighlight,
                                                  _swipableClassName: className,
                                                  _swipableRest: rest,
                                              })}
                                          </React.Fragment>
                                      ))
                            }
                        </SwipeableList>
                    ) : (
                        <DynamicObjectTableView items={procItems.map(itemGetter)} inline={inline} context={context} />
                    )}
                </div>
            </DataContextWrapper>
        </Root>
    );
};
