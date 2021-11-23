import { Accordion, AccordionSummary, Typography, AccordionDetails, List, ListItem, Select, MenuItem, IconButton, ListItemIcon, ListSubheader, FormControlLabel, Switch, Button, TextField, Slide } from "@material-ui/core";
import { ExpandMore, ClearAll } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import _ from "lodash";
import React from "react";
import { useDrop } from "react-dnd";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { getDynamicViews } from "../../unigraph-react";
import { AutoDynamicView } from "./AutoDynamicView";
import { isMobile } from "../../utils";
import { buildGraph as buildGraphFn } from "unigraph-dev-common/lib/api/unigraph";
import InfiniteScroll from "react-infinite-scroll-component";
import { setupInfiniteScrolling } from "./infiniteScrolling";

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
        return Object.entries(groupsMap).map(([k, v]) => { return { name: k, items: v as any[] } })
    },
}

const DynamicListItem = ({ reverse, listUid, item, index, context, callbacks, itemUids, itemRemover }: any) => {
    return <React.Fragment>
        <Slide direction={reverse ? "down" : "up"} in key={item.uid}>
            <ListItem>
                <ListItemIcon onClick={() => {
                    itemRemover(item['uid'])
                }} style={{ display: (itemRemover === _.noop || isMobile()) ? "none" : "" }}><ClearAll /></ListItemIcon>
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
    defaultFilter?: string,
    reverse?: boolean,
    virtualized?: boolean,
    groupBy?: string,
    buildGraph?: boolean
    groupers?: any,
    noBar?: boolean,
}

const DynamicListBasic = ({ reverse, items, context, listUid, callbacks, itemUids, itemRemover, itemGetter, infinite = true }: any) => {
    return items.map((el: any, index: number) => <DynamicListItem 
        item={itemGetter(el)} index={index} context={context} listUid={listUid} 
        callbacks={callbacks} itemUids={itemUids} itemRemover={itemRemover} reverse={reverse}
    />);
}

const DynamicList = ({ reverse, items, context, listUid, callbacks, itemUids, itemRemover, itemGetter, infinite = true, buildGraph }: any) => {

    const [loadedItems, setLoadedItems] = React.useState<any[]>([]);
    const [setupProps, setSetupProps] = React.useState<{next: any, cleanup: any} | null>(null);

    React.useEffect(() => {
        if (setupProps?.cleanup) setupProps.cleanup();
        let newProps: any = undefined;
        if (items.length) {
            newProps = setupInfiniteScrolling(items.map((el: any) => itemGetter(el).uid), infinite ? 25 : items.length, (items: any[]) => {
                setLoadedItems(buildGraph ? buildGraphFn(items) : items);
            });
            setSetupProps(newProps);
            newProps.next();
        } else {setLoadedItems([])};

        return function cleanup () { newProps?.cleanup() }
    }, [items])

    return <InfiniteScroll
        dataLength={loadedItems.length}
        next={setupProps?.next || (() => {})}
        hasMore={loadedItems.length < items.length}
        loader={<React.Fragment/>}
        endMessage={
            <React.Fragment/>
        }
        scrollableTarget="scrollableDiv"
    >
        {loadedItems.map((el: any, index: number) => <DynamicListItem
            item={el} index={index} context={context} listUid={listUid} reverse={reverse}
            callbacks={callbacks} itemUids={items.map((el: any) => itemGetter(el).uid)} itemRemover={itemRemover}
        />)}
    </InfiniteScroll>  
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
export const DynamicObjectListView: React.FC<DynamicObjectListViewProps> = ({ items, groupers, groupBy, listUid, context, callbacks, itemGetter = _.identity, itemRemover = _.noop, filters = [], defaultFilter, reverse, virtualized, buildGraph, noBar }) => {

    const [optionsOpen, setOptionsOpen] = React.useState(false);
    let setGroupBy: any;
    [groupBy, setGroupBy] = React.useState(groupBy || '');
    groupers = {...groupers, ...groupersDefault}
    const [reverseOrder, setReverseOrder] = React.useState(reverse);

    const isStub = !items[0] || Object.keys(itemGetter(items[0])).filter(el => el.startsWith('_value')).length < 1 || items[0]._stub;

    const totalFilters: Filter[] = [
        { id: "no-filter", fn: () => true },
        { id: "no-deleted", fn: (obj) => (obj?.['dgraph.type']?.includes?.('Deleted')) ? null : obj },
        { id: "no-noview", fn: (obj) => getDynamicViews().includes(obj?.['type']?.['unigraph.id']) ? obj : null },
        { id: "no-textual", fn: (obj) => ["$/schema/markdown"].includes(obj?.['type']?.['unigraph.id']) ? null : obj },
        { id: "no-hidden", fn: (obj) => obj['_hide'] !== true },
        ...filters];
    const [filtersUsed, setFiltersUsed] = React.useState([...(defaultFilter ? [defaultFilter] : ["no-noview", "no-deleted", "no-textual", "no-hidden"])]);

    const [procItems, setProcItems] = React.useState<any[]>([]);
    React.useEffect(() => {
        let allItems: any[] = [];
        if (reverseOrder) allItems = [...items].reverse();
        else allItems = [...items];
        filtersUsed.forEach(el => {
            const filter = totalFilters.find((flt) => flt.id === el);
            allItems = allItems.filter((it: any) => (filter?.fn || (() => true))(itemGetter(it)));
        })
        setProcItems(allItems)
    }, [reverseOrder, items, filtersUsed])

    const contextRef = React.useRef(context);
    React.useEffect(() => contextRef.current = context, [context]);

    const [{ canDrop }, drop] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: { uid: string }, monitor) => {
            if (!monitor.didDrop()) window.unigraph.runExecutable('$/executable/add-item-to-list', { where: contextRef.current.uid, item: item.uid })
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        })
    }))

    return <div style={{
        backgroundImage: canDrop ? 'url("/assets/drop-here.png")' : '',
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        height: "100%", width: "100%",
        display: "flex", flexDirection: "column", overflowY: "hidden"
    }} ref={drop}>
        <div style={{ display: "flex" }}>
            {noBar ? [] : <Accordion expanded={optionsOpen} onChange={() => setOptionsOpen(!optionsOpen)} variant={"outlined"} style={{ flexGrow: 1, minWidth: 0 }}>
            <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="panel1bh-content"
                id="panel1bh-header"
            >
                <Typography style={{ flexBasis: '50%', flexShrink: 0 }}>View options</Typography>
                <Typography>{procItems.length} items</Typography>
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
                    <ListItem style={{ display: context?.uid ? "" : "none" }}>
                        <Button onClick={() => { window.wsnavigator(`/graph?uid=${context.uid}`) }}>Show Graph view</Button>
                    </ListItem>
                </List>

            </AccordionDetails>
        </Accordion>}
            <IconButton
                onClick={() => itemRemover(procItems.map((el, idx) => idx))}
                style={{ display: itemRemover === _.noop ? "none" : "" }}
            ><ClearAll /></IconButton>
        </div>
        <div style={{ flexGrow: 1, overflowY: "auto" }} id="scrollableDiv" >
            {!groupBy.length ? 
                React.createElement(isStub ? DynamicList : DynamicListBasic, { reverse: reverseOrder, items: procItems, context, listUid, callbacks, itemRemover, itemUids: procItems.map(el => el.uid), itemGetter, buildGraph }) :
                groupers[groupBy](procItems.map(itemGetter)).map((el: Group) => <React.Fragment>
                    <ListSubheader>{el.name}</ListSubheader>
                    {React.createElement(isStub ? DynamicList : DynamicListBasic, { reverse: reverseOrder, items: el.items, context, listUid, callbacks, itemRemover, itemUids: el.items.map(ell => ell.uid), itemGetter: _.identity, infinite: false, buildGraph})}
                </React.Fragment>)
            }
        </div>
    </div>
}