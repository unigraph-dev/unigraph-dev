import React, { useState } from "react";

import { pkg as bookmarkPackage } from 'unigraph-dev-common/lib/data/unigraph.bookmark.pkg';

import { DynamicViewRenderer } from "../../global";
import { List, ListItem, TextField, Button, IconButton, ListItemSecondaryAction, ListItemText, ListItemIcon, Avatar } from "@material-ui/core";
import { Delete, Description, Link, Public } from "@material-ui/icons";
import { registerDynamicViews, withUnigraphSubscription } from 'unigraph-dev-common/lib/api/unigraph-react'
import { Tag } from "../semantic/Tag";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { getExecutableId } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicView } from "../../components/ObjectView/DefaultObjectView";
import { getComponentFromPage } from "../../Workspace";

type ABookmark = {
    uid?: string,
    name: string,
    url: string,
    favicon: string,
    semantic_properties: {
        children: any[]
    },
    creative_work?: {
        text?: string,
        abstract?: string,
        author?: string
    }
}

export const createBookmark: (t: string) => Promise<ABookmark> = (text: string) => {
    let tags_regex = /#[a-zA-Z0-9]*\b ?/gm;
    let tags = text.match(tags_regex) || [];
    tags = tags.map(tag => tag.slice(1).trim());
    text = text.replace(tags_regex, '');

    const url = new URL(text.trim());
    window.unigraph.runExecutable(getExecutableId(bookmarkPackage, "add-bookmark"), {url: url, tags: tags})
    return new Promise((res, rej) => {res(undefined as any)});
} 

function BookmarksBody ({data}: { data: ABookmark[] }) {
    
    const bookmarks = data;
    const [newName, setNewName] = useState("");

    return <div>
        Hello bookmark!    <br/> 
        There are currently {bookmarks.length} bookmarks!   <br/>
        <List>
            {bookmarks.map(it => <ListItem button key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </List>
        <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
        <Button onClick={() => createBookmark(newName).then((obj: any) => {return false;})}>Add</Button>
        For example, enter #tag1 https://example.com
    </div>
}

export const Bookmarks = withUnigraphSubscription(
    // @ts-ignore
    BookmarksBody,
    { defaultData: [], schemas: [], packages: [bookmarkPackage]},
    { afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
        window.unigraph.subscribeToType("$/schema/web_bookmark", (result: ABookmark[]) => {setData(result)}, subsId);
    }}
)

export const BookmarkItem: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: ABookmark = unpad(data);
    console.log(unpadded)
    let totalCallbacks = callbacks || {
        'onUpdate': (data: Record<string, any>) => {
            throw new Error("not implemented")
            //window.unigraph.updateObject(data.uid, {"done": unpad(data).done});
        }
    };

    return <React.Fragment>
        <ListItemIcon><Avatar alt={"favicon of "+unpadded.name} src={unpadded.favicon}><Public/></Avatar></ListItemIcon>
        <ListItemText 
            primary={unpadded.name}
            secondary={<div style={{display: "flex", alignContent: "center"}}>
                <Link onClick={() => {
                    window.open(unpadded.url, "_blank")
                }}/>
                {typeof unpadded.creative_work?.text === "string" ? <Description onClick={() => {
                    const htmlUid = data?.get('creative_work/text')?.['_value']?.['_value']?.['uid'];
                    if (htmlUid) window.newTab(window.layoutModel, getComponentFromPage('/library/object', {uid: htmlUid, context: data.uid}));
                    if (callbacks?.removeFromContext) callbacks.removeFromContext();
                }}/> : []}
                {!unpadded.semantic_properties?.children?.map ? [] :
                unpadded.semantic_properties?.children?.map(it => <Tag data={it}/>)}
                {typeof unpadded.creative_work?.abstract === "string" ? unpadded.creative_work?.abstract : []}
            </div>}
        />
        <ListItemSecondaryAction>
            <IconButton aria-label="delete" onClick={() => window.unigraph.deleteObject(unpadded.uid!)}>
                <Delete/>
            </IconButton>
        </ListItemSecondaryAction>
    </React.Fragment>
}

registerDynamicViews({"$/schema/web_bookmark": BookmarkItem})