import { Accordion, AccordionSummary, Typography, AccordionDetails, List, ListItem, Select, MenuItem, IconButton, ListItemIcon, ListSubheader } from "@material-ui/core";
import { ExpandMore, ClearAll } from "@material-ui/icons";
import React from "react";
import { useDrop } from "react-dnd";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicView } from "./DefaultObjectView";

type Group = {
    name: string,
    items: any[]
}

type Grouper = (el: any[]) => Group[];

const groupers: Record<string, Grouper> = {
    'date': (el: any[]) => {
        let groupsMap: any = {"Today": [], "Last week": [], "Last month": [], "Earlier": []};
        el.forEach(it => {
            if (it && it._timestamp && it._timestamp._updatedAt) {
                let day = new Date(it._timestamp._updatedAt);
                let now = new Date();
                if (now.getTime() - day.getTime() <= 1000*60*60*24 ) {
                    groupsMap['Today'].push(it);
                } else if (now.getTime() - day.getTime() <= 1000*60*60*24*7) {
                    groupsMap['Last week'].push(it);
                } else if (now.getTime() - day.getTime() <= 1000*60*60*24*31) {
                    groupsMap['Last month'].push(it);
                } else {
                    groupsMap['Earlier'].push(it);
                }
            } else {
                groupsMap['Earlier'].push(it)
            }
        });
        return Object.entries(groupsMap).map(([k, v]) => {return {name: k, items: v as any[]}})
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
        return Object.entries(groupsMap).map(([k, v]) => {return {name: k, items: v as any[]}})
    },
}

const DynamicListItem = ({listUid, item, index, context}: any) => {
    return <React.Fragment>
        <ListItem>
            <ListItemIcon onClick={() => {
                if (listUid) window.unigraph.deleteItemFromArray(listUid, item['uid'], context['uid'])
            }} ><ClearAll/></ListItemIcon>
            <AutoDynamicView object={new UnigraphObject(item)} callbacks={{
                context: context,
                removeFromContext: listUid ? (where: undefined | "left" | "right") => { 
                    let uids = {"left": Array.from(Array(index).keys()), "right": undefined, "": undefined}[where || ""] || [item['uid']]
                    console.log(uids)
                    window.unigraph.deleteItemFromArray(listUid, uids, context['uid'])
                } : undefined
            }} />
        </ListItem>
    </React.Fragment>
}

export const DynamicObjectListView = ({items, listUid, context}: {items: any[], listUid?: string, context: any}) => {
    
    const [optionsOpen, setOptionsOpen] = React.useState(false);
    const [groupBy, setGroupBy] = React.useState('');

    const getContext = () => context;

    const [{ canDrop }, drop] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: {uid: string}) => {
          window.unigraph.runExecutable('$/executable/add-item-to-list', {where: context.uid, item: item.uid})
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
            height: "100%"
        }} ref={drop}>
            <div style={{display: "flex"}}><Accordion expanded={optionsOpen} onChange={() => setOptionsOpen(!optionsOpen)} variant={"outlined"} style={{flexGrow: 1}}> 
            <AccordionSummary  
            expandIcon={<ExpandMore />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
            >
            <Typography style={{flexBasis: '33.33%', flexShrink: 0}}>View options</Typography>
            <Typography>{items.length} items</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <List>
                    <ListItem>
                        <Typography>Group items by</Typography>
                        <Select
                            value={groupBy}
                            onChange={(ev) => {setGroupBy(ev.target.value as string)}}
                            style={{marginLeft: "24px"}}
                            displayEmpty
                        >
                            <MenuItem value={''}>None</MenuItem>
                            <MenuItem value={'date'}>Date added</MenuItem>
                            <MenuItem value={'type'}>Item type</MenuItem>
                        </Select>
                    </ListItem>
                </List>

            </AccordionDetails>
        </Accordion>
        <IconButton onClick={() => {if (listUid) window.unigraph.deleteItemFromArray(listUid, items.map((el, idx) => idx), context['uid'])}}><ClearAll/></IconButton>
        </div>
            
            {!groupBy.length ? 
                items.map((el, index) => <DynamicListItem item={el['_value']} index={index} context={context} listUid={listUid} />) : 
                groupers[groupBy](items.map(it => it['_value'])).map((el: Group) => <React.Fragment>
                    <ListSubheader>{el.name}</ListSubheader>
                    {el.items.map((it, index) => <DynamicListItem item={it} index={index} context={context} listUid={listUid} />)}
                </React.Fragment>)
            }
    </div>
}