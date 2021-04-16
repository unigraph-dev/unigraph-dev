import React, { useState, useEffect } from "react";

import { schemaColor, schemaTag, schemaNote, schemaSemanticProperties } from 'unigraph-dev-common/lib/data/schemasTodo';
import { schemaIconURL, schemaURL, schemaWebBookmark } from 'unigraph-dev-common/lib/data/schemasBookmark';

import { DynamicViewRenderer } from "../../global";
import { List, ListItem, TextField, Button, Chip, IconButton, ListItemSecondaryAction, ListItemText, ListItemIcon, Avatar } from "@material-ui/core";
import { LocalOffer, Delete, Link } from "@material-ui/icons";
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph'
import { withUnigraphSubscription } from 'unigraph-dev-common/lib/api/unigraph-react'

type ABookmark = {
    uid?: string,
    name: string,
    url: string,
    favicon: string,
    semantic_properties: {
        tags: {uid?: string, color: string, name: string}[]
        notes: any[]
    }
}

export const createBookmark: (t: string) => Promise<ABookmark> = (text: string) => {
    const url = new URL(text);
    return new Promise((res, rej) => {
        window.unigraph.proxyFetch(url).then((fin: Blob) => {
            fin.text().then(text => {
                const match = text.match(/(<head>.*<\/head>)/gms);
                const head = match ? match[0] : "";
                let parser = new DOMParser();
                let headDom = parser.parseFromString(head, "text/html");
                var favicon = url.origin + "/favicon.ico";
                headDom.head.childNodes.forEach((node: any) => {
                    if (node.nodeName === "LINK" && node?.name?.includes('icon') && node.href) {
                        let newUrl = new URL(node.href, url.origin)
                        favicon = newUrl.href;
                    }
                })
                console.log(headDom)
                res({
                    name: headDom.title || url.href,
                    url: url.href,
                    favicon: favicon,
                    semantic_properties: {
                        tags: [],
                        notes: []
                    }
                })
            })
        }).catch(rej)
    })
} 

function BookmarksBody ({data}: { data: ABookmark[] }) {
    
    const bookmarks = data;
    const [newName, setNewName] = useState("");

    return <div>
        Hello bookmark!    <br/> 
        There are currently {bookmarks.length} bookmarks!   <br/>
        <List>
            {bookmarks.map(it => <ListItem button key={it.uid}>
                <BookmarkItem data={it} />
            </ListItem>)}
        </List>
        <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
        <Button onClick={() => createBookmark(newName).then((obj: any) => window.unigraph.addObject(obj, "$/schema/web_bookmark"))}>Add</Button>
    </div>
}

export const Bookmarks = withUnigraphSubscription(
    // @ts-ignore
    BookmarksBody,
    { defaultData: [], schemas: [
        {name: "$/schema/color", schema: schemaColor},
        {name: "$/schema/tag", schema: schemaTag},
        {name: "$/schema/note", schema: schemaNote},
        {name: "$/schema/semantic_properties", schema: schemaSemanticProperties},
        {name: "$/schema/icon_url", schema: schemaIconURL},
        {name: "$/schema/url", schema: schemaURL},
        {name: "$/schema/web_bookmark", schema: schemaWebBookmark},
    ]},
    { afterSchemasLoaded: (subsId: number, setData: any) => {
        window.unigraph.subscribeToType("$/schema/web_bookmark", (result: ABookmark[]) => {setData(result)}, subsId);
    }}
)

export const BookmarkItem: DynamicViewRenderer = ({data, callbacks}) => {
    let unpadded: ABookmark = window.unigraph.unpad(data);
    let totalCallbacks = callbacks || {
        'onUpdate': (data: Record<string, any>) => {
            throw new Error("not implemented")
            //window.unigraph.updateObject(data.uid, {"done": window.unigraph.unpad(data).done});
        }
    };

    return <React.Fragment>
        <ListItemIcon><Avatar alt={"favicon of "+unpadded.name} src={unpadded.favicon}>I</Avatar></ListItemIcon>
        <ListItemText 
            primary={unpadded.name}
            secondary={[<Link onClick={() => {window.open(unpadded.url, "_blank")}}></Link>
                ,...(!unpadded.semantic_properties?.tags?.map ? [] :
                unpadded.semantic_properties?.tags?.map(tag => <Chip
                    size="small"
                    icon={<LocalOffer/>}
                    style={{
                        backgroundColor: tag.color
                    }}
                    label={tag.name}
                />
            ))]}
        />
        <ListItemSecondaryAction>
            <IconButton aria-label="delete" onClick={() => window.unigraph.deleteObject(unpadded.uid!)}>
                <Delete/>
            </IconButton>
        </ListItemSecondaryAction>
    </React.Fragment>
}