import React, { useState, useEffect } from "react";

import { schemaColor, schemaTag, schemaNote, schemaSemanticProperties } from 'unigraph-dev-common/lib/data/schemasTodo';
import { schemaIconURL, schemaURL, schemaWebBookmark } from 'unigraph-dev-common/lib/data/schemasBookmark';

import { DynamicViewRenderer } from "../../global";
import { List, ListItem, TextField, Button, Chip, IconButton, ListItemSecondaryAction, ListItemText, ListItemIcon, Avatar } from "@material-ui/core";
import { LocalOffer, Delete, Link } from "@material-ui/icons";
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph'

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

export function Bookmarks () {
    
    const [initialized, setInitialized] = useState(false);
    const [subsId, setSubsId] = useState(getRandomInt());
    const [bookmarks, setBookmarks]: [any[], Function] = useState([]);
    const [newName, setNewName] = useState("");

    const init = async () => {
        const promises = [
            window.unigraph.ensureSchema("$/schema/color", schemaColor),
            window.unigraph.ensureSchema("$/schema/tag", schemaTag),
            window.unigraph.ensureSchema("$/schema/note", schemaNote),
            window.unigraph.ensureSchema("$/schema/semantic_properties", schemaSemanticProperties),
            window.unigraph.ensureSchema("$/schema/icon_url", schemaIconURL),
            window.unigraph.ensureSchema("$/schema/url", schemaURL),
            window.unigraph.ensureSchema("$/schema/web_bookmark", schemaWebBookmark)
        ];
        Promise.all(promises).then(() => {
            setInitialized(true);
            window.unigraph.subscribeToType("$/schema/web_bookmark", (result: ABookmark[]) => {setBookmarks(result)}, subsId);
        });
    }

    useEffect(() => {
        init();

        return function cleanup() {
            window.unigraph.unsubscribe(subsId);
        };
    }, []);



    return <div>
        {!initialized ? <p>Loading...</p> : <div>
            Hello bookmark!    <br/> 
            There are currently {bookmarks.length} bookmarks!   <br/>
            <List>
                {bookmarks.map(it => <ListItem button key={it.uid}>
                    <BookmarkItem data={it} />
                </ListItem>)}
            </List>
            <TextField value={newName} onChange={(e) => setNewName(e.target.value)}></TextField>
            <Button onClick={() => createBookmark(newName).then((obj: any) => window.unigraph.addObject(obj, "$/schema/web_bookmark"))}>Add</Button>
        </div>}
    </div>
}

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