import { Accordion, AccordionSummary, Typography, AccordionDetails, List, ListItem, Select, MenuItem, IconButton, ListItemIcon, ListSubheader, FormControlLabel, Switch, Button, TextField, Slide, Divider, makeStyles } from "@material-ui/core";
import { ExpandMore, ClearAll, InboxOutlined } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import _ from "lodash";
import React from "react";
import { useDrop } from "react-dnd";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { getDynamicViews } from "../../unigraph-react";
import { AutoDynamicView } from "./AutoDynamicView";
import { DataContext, isMobile, TabContext } from "../../utils";
import { buildGraph as buildGraphFn, getRandomInt } from "unigraph-dev-common/lib/utils/utils";
import InfiniteScroll from "react-infinite-scroll-component";
import { setupInfiniteScrolling } from "./infiniteScrolling";
import { byElementIndex } from "unigraph-dev-common/lib/utils/entityUtils";
import { DragandDrop } from "./DragandDrop";

type Group = {
    name: string,
    items: any[]
}

type Grouper = (el: any[]) => Group[];

const groupersDefault: Record<string, Grouper> = {
    'date': (el: any[]) => {
        let groupsMap: any = { "Today": [], "Last week": [], "Last month": [], "Earlier": [] };
        el.forEach(it => {
            if (it && it._timestamp && it._timestamp._updatedAt) {
                let day = new Date(it._timestamp._updatedAt);
                let now = new Date();
                if (now.getTime() - day.getTime() <= 1000 * 60 * 60 * 24) {
                    groupsMap['Today'].push(it);
                } else if (now.getTime() - day.getTime() <= 1000 * 60 * 60 * 24 * 7) {
                    groupsMap['Last week'].push(it);
                } else if (now.getTime() - day.getTime() <= 1000 * 60 * 60 * 24 * 31) {
                    groupsMap['Last month'].push(it);
                } else {
                    groupsMap['Earlier'].push(it);
                }
            } else {
                groupsMap['Earlier'].push(it)
            }
        });
        return Object.entries(groupsMap).map(([k, v]) => { return { name: k, items: v as any[] } })
    },
    'type': (el: any[]) => {
        let groupsMap: any = {};
        el.forEach(it => {
            let type = it?.type?.['unigraph.id'] || 'Other'
            if (groupsMap[type]) {
                groupsMap[type].push(it)
            } else {
                groupsMap[type] = [it]
            }
        })
        return Object.entries(groupsMap).map(([k, v]) => { return { name: k, items: v as any[] } }).sort((a, b) => a.name > b.name ? 1 : -1)
    },
}

const DynamicListItem = ({ reverse, listUid, item, index, context, callbacks, itemUids, itemRemover, noRemover, compact }: any) => {
    return <React.Fragment>
        <Slide direction={reverse ? "down" : "up"} in key={item.uid}>
            <ListItem style={{ ...(compact ? { paddingTop: "2px", paddingBottom: "2px" } : {}) }}>
                <ListItemIcon onClick={() => {
                    itemRemover(item['uid'])
                }} style={{ display: (itemRemover === _.noop || isMobile() || noRemover) ? "none" : "" }}><ClearAll /></ListItemIcon>
                <AutoDynamicView object={new UnigraphObject(item)} callbacks={{
                    ...callbacks,
                    context: context,
                    removeFromContext: (where: undefined | "left" | "right") => {
                        let uids = {
                            "left": itemUids.slice(0, index),
                            "right": undefined,
                            "": undefined
                        }[where || ""] || [item['uid']]
                        itemRemover(uids)
                    }
                }} />
            </ListItem>
        </Slide>
    </React.Fragment>
}

export type ItemRemover = (uids: string | string[] | number | number[]) => void;
export type Filter = { id: string, fn: (_: any) => boolean }

export type DynamicObjectListViewProps = {
    items: any[],
    listUid?: string,
    context: any,
    callbacks?: any,
    itemGetter?: any,
    itemRemover?: ItemRemover,
    filters?: Filter[],
    defaultFilter?: string | string[],
    reverse?: boolean,
    virtualized?: boolean,
    groupBy?: string,
    buildGraph?: boolean
    groupers?: any,
    noBar?: boolean,
    noRemover?: boolean,
    noDrop?: boolean,
    compact?: boolean,
    subscribeOptions?: any,
    titleBar?: any,
}

const DynamicListBasic = ({ reverse, items, context, listUid, callbacks, itemUids, itemRemover, itemGetter, infinite = true, noRemover, compact }: any) => {
    const tabContext = React.useContext(TabContext);
    return <DragandDrop dndContext={tabContext.viewId} listId={context?.uid} isReverse={reverse} arrayId={listUid}>
        {items.map((el: any, index: number) => <DynamicListItem
            item={itemGetter(el)} index={index} context={context} listUid={listUid} compact={compact}
            callbacks={callbacks} itemUids={itemUids} itemRemover={itemRemover} reverse={reverse} noRemover={noRemover}
        />)}</DragandDrop>;
}

const DynamicList = ({ reverse, items, context, listUid, callbacks, itemUids, itemRemover, itemGetter, infinite = true, buildGraph, parId, noRemover, compact, subscribeOptions }: any) => {

    const tabContext = React.useContext(TabContext);
    const [loadedItems, setLoadedItems] = React.useState<any[]>([]);
    const [setupProps, setSetupProps] = React.useState<{ next: any, cleanup: any } | null>(null);

    React.useEffect(() => {
        if (setupProps?.cleanup) setupProps.cleanup();
        let newProps: any = undefined;
        if (items.length) {
            items.sort(byElementIndex);
            newProps = setupInfiniteScrolling(items.map((el: any) => itemGetter(el).uid), infinite ? 25 : items.length, (items: any[]) => {
                setLoadedItems(buildGraph ? buildGraphFn(items) : items);
            }, subscribeOptions);
            setSetupProps(newProps);
            newProps.next();
        } else { setLoadedItems([]) };

        return function cleanup() { newProps?.cleanup() }
    }, [JSON.stringify(items.map((el: any) => el.uid))])

    return <InfiniteScroll
        dataLength={loadedItems.length}
        next={setupProps?.next || (() => { })}
        hasMore={loadedItems.length < items.length}
        loader={<React.Fragment />}
        scrollableTarget={"scrollableDiv" + parId}
        endMessage={
            <React.Fragment />
        }
    >
        <DragandDrop dndContext={tabContext.viewId} listId={context?.uid} isReverse={reverse}  arrayId={listUid}>
            {loadedItems.map((el: any, index: number) => <DynamicListItem
                item={el} index={index} context={context} listUid={listUid} reverse={reverse} compact={compact}
                callbacks={callbacks} itemUids={items.map((el: any) => itemGetter(el).uid)} itemRemover={itemRemover} noRemover={noRemover}
            />)}
        </DragandDrop>
    </InfiniteScroll>
}

const MultiTypeDescriptor = ({items, selectedTab, setSelectedTab}: {items: any[], selectedTab: string, setSelectedTab: any}) => {

    const itemGroups = groupersDefault['type'](items);
    console.log(itemGroups)

    return itemGroups.length > 1 ? <React.Fragment>
        <Divider variant="middle" orientation="vertical" style={{height: "auto"}} />
        <div style={{whiteSpace: "nowrap", display: "flex"}}>
        {itemGroups.map((el, index) => {
            return <TabButton isSelected={selectedTab === el.name} onClick={() => setSelectedTab(el.name)}>
                <div style={{minHeight: "18px", minWidth: "18px", height: "18px", width: "18px", alignSelf: "center", marginRight: "3px", opacity: 0.54, backgroundImage: `url("data:image/svg+xml,${(window.unigraph.getNamespaceMap)?.()?.[el.name]?._icon}")`}}/>
                <Typography style={{color: "grey", marginRight: "4px"}}>{(window.unigraph.getNamespaceMap)?.()?.[el.name]?._name}:</Typography>
                <Typography style={{marginRight: "8px"}}>{el.items.length}</Typography>
            </TabButton>
        })}
    </div> </React.Fragment>: <React.Fragment />
}

const useStyles = makeStyles(theme => ({
    content: {
      width: "100%",
      overflow: "auto",
    },
  }));

const TabButton = ({children, isSelected, onClick}: any) => {
    return <div style={{cursor: "pointer", display: "flex", padding: "4px", paddingTop: "2px", paddingBottom: "2px", borderRadius: "8px", ...(isSelected ? {backgroundColor: "#E9E9E9", borderRadius: "8px"} : {})}} onClick={onClick}>
        {children}
    </div>
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
export const DynamicObjectListView: React.FC<DynamicObjectListViewProps> = ({ titleBar, items, groupers, groupBy, listUid, context, callbacks, itemGetter = _.identity, itemRemover = _.noop, filters = [], defaultFilter, reverse, virtualized, buildGraph, noBar, noRemover, noDrop, compact, subscribeOptions }) => {

    const classes = useStyles();

    const tabContext = React.useContext(TabContext);
    
    const [optionsOpen, setOptionsOpen] = React.useState(false);
    let setGroupBy: any;
    [groupBy, setGroupBy] = React.useState(groupBy || '');
    groupers = { ...groupers, ...groupersDefault }
    const [reverseOrder, setReverseOrder] = React.useState(reverse);
    const [currentTab, setCurrentTab] = React.useState("");

    const isStub = !items[0] || Object.keys(itemGetter(items[0])).filter(el => el.startsWith('_value')).length < 1 || items[0]._stub;

    const totalFilters: Filter[] = [
        { id: "no-filter", fn: () => true },
        { id: "no-deleted", fn: (obj) => (obj?.['dgraph.type']?.includes?.('Deleted')) ? null : obj },
        { id: "no-noview", fn: (obj) => getDynamicViews().includes(obj?.['type']?.['unigraph.id']) ? obj : null },
        { id: "no-trivial", fn: (obj) => ["$/schema/markdown", "$/schema/subentity"].includes(obj?.['type']?.['unigraph.id']) ? null : obj },
        { id: "no-hidden", fn: (obj) => obj['_hide'] !== true },
        ...filters];
    const [filtersUsed, setFiltersUsed] = React.useState([...(defaultFilter ? (Array.isArray(defaultFilter) ? defaultFilter : [defaultFilter]) : ["no-noview", "no-deleted", "no-trivial", "no-hidden"])]);

    const [totalItems, setTotalItems] = React.useState<any[]>([]);
    const [procItems, setProcItems] = React.useState<any[]>([]);
    React.useEffect(() => {
        let allItems: any[] = [];
        if (reverseOrder) allItems = [...items].reverse();
        else allItems = [...items];
        filtersUsed.forEach(el => {
            const filter = totalFilters.find((flt) => flt.id === el);
            allItems = allItems.filter((it: any) => (filter?.fn || (() => true))(itemGetter(it)));
        })
        setTotalItems([...allItems]);
        if (currentTab.length >= 1) allItems = allItems.filter((it: any) => itemGetter(it).type['unigraph.id'] === currentTab)
        setProcItems(allItems);
        if (allItems.length === 0) setCurrentTab("");
    }, [reverseOrder, items, filtersUsed, currentTab])

    const contextRef = React.useRef(context);
    React.useEffect(() => contextRef.current = context, [context]);
    const [parId] = React.useState(getRandomInt());
    const [dndContext] = React.useState(tabContext.viewId || parId);

    const [{ canDrop }, drop] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: { uid: string, dndContext: any, removeFromContext?: any }, monitor) => {
            if (!monitor.didDrop() && !noDrop && contextRef.current) {
                window.unigraph.runExecutable('$/executable/add-item-to-list', { where: contextRef.current.uid, item: item.uid })
                if (tabContext.viewId === item.dndContext) {item?.removeFromContext()};
                //console.log(tabContext, item.dndContext)
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        })
    }))

    return <div style={{
        height: "100%", width: "100%",
        display: "flex", flexDirection: "column", overflowY: "hidden",
        minHeight: canDrop ? "200px" : "",
    }} ref={drop}>
        <DataContext.Provider value={{ rootUid: context?.uid || "0x0" }}>
            <div style={{ display: "flex" }}>
                {noBar ? [] : <React.Fragment>
                    <Accordion expanded={optionsOpen} variant={"outlined"} style={{ flexGrow: 1, minWidth: 0, margin: "8px" }}>
                        <AccordionSummary
                            expandIcon={<ExpandMore onClick={() => setOptionsOpen(!optionsOpen)}/>}
                            aria-controls="panel1bh-content"
                            id="panel1bh-header"
                            classes={{content: classes.content}}
                            style={{cursor: "initial"}}
                        >
                            <TabButton isSelected={currentTab === "" && groupersDefault['type']?.(totalItems.map(itemGetter))?.length > 1} onClick={() => {setCurrentTab("")}}>
                                <Typography style={{whiteSpace: "nowrap"}}>{totalItems.length}{titleBar || " items"}</Typography>
                            </TabButton>
                            <MultiTypeDescriptor items={totalItems.map(itemGetter)} selectedTab={currentTab} setSelectedTab={setCurrentTab} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                <ListItem>
                                    <Typography>Group items by</Typography>
                                    <Select
                                        value={groupBy}
                                        onChange={(ev) => { setGroupBy(ev.target.value as string) }}
                                        style={{ marginLeft: "24px" }}
                                        displayEmpty
                                    >
                                        <MenuItem value={''}>None</MenuItem>
                                        {Object.keys(groupers).map(el => <MenuItem value={el}>{el}</MenuItem>)}
                                    </Select>
                                </ListItem>
                                <ListItem>
                                    <FormControlLabel
                                        control={<Switch checked={reverseOrder} onChange={() => setReverseOrder(!reverseOrder)} name={"moveToInbox"} />}
                                        label={"Latest items on top"}
                                    />
                                </ListItem>
                                <ListItem>
                                    <Autocomplete
                                        multiple
                                        value={filtersUsed}
                                        onChange={(event, newValue) => {
                                            setFiltersUsed(newValue)
                                        }}
                                        id="filter-selector"
                                        options={totalFilters.map(el => el.id)}
                                        style={{ width: 300 }}
                                        renderInput={(params) => <TextField {...params} label="Filter presets" variant="outlined" />}
                                    />
                                </ListItem>
                                <ListItem style={{ display: (context?.uid && !noRemover) ? "" : "none" }}>
                                    <Button onClick={() => { window.wsnavigator(`/graph?uid=${context.uid}`) }}>Show Graph view</Button>
                                </ListItem>
                            </List>

                        </AccordionDetails>
                    </Accordion>
                    <IconButton
                        onClick={() => itemRemover(procItems.map((el, idx) => itemGetter(el).uid))}
                        style={{ display: itemRemover === _.noop ? "none" : "" }}
                    ><ClearAll /></IconButton>
                    <IconButton
                        style={{ display: (canDrop && !noDrop && contextRef.current) ? "" : "none" }}
                    ><InboxOutlined /></IconButton>
                </React.Fragment>}
            </div>
            <div style={{ flexGrow: 1, overflowY: "auto" }} id={"scrollableDiv" + parId} >
                {!groupBy.length ?

                    React.createElement(isStub ? DynamicList : DynamicListBasic, { reverse: reverseOrder, items: procItems, context, listUid, callbacks, itemRemover, itemUids: procItems.map(el => el.uid), itemGetter, buildGraph, parId, noRemover, compact, subscribeOptions }) :
                    groupers[groupBy](procItems.map(itemGetter)).map((el: Group) => <React.Fragment>
                        <ListSubheader>{el.name}</ListSubheader>
                        {React.createElement(isStub ? DynamicList : DynamicListBasic, { reverse: reverseOrder, items: el.items, context, listUid, callbacks, itemRemover, itemUids: el.items.map(ell => ell.uid), itemGetter: _.identity, infinite: false, buildGraph, parId, noRemover, compact, subscribeOptions })}
                    </React.Fragment>)
                }
            </div>
        </DataContext.Provider>
    </div>
}