import React, { useState } from "react";

import { pkg as bookmarkPackage } from 'unigraph-dev-common/lib/data/unigraph.bookmark.pkg';

import { DynamicViewRenderer } from "../../global";
import { List, ListItem, TextField, Button, IconButton, ListItemSecondaryAction, ListItemText, ListItemIcon, Avatar, Typography } from "@material-ui/core";
import { Delete, Description, Link, Public } from "@material-ui/icons";
import { registerDynamicViews, registerQuickAdder, withUnigraphSubscription } from '../../unigraph-react'
import { Tag } from "../semantic/Tag";
import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import { getExecutableId } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";
import { getComponentFromPage } from "../../Workspace";
import { openUrl } from "../../utils";
import { DynamicObjectListView } from "../../components/ObjectView/DynamicObjectListView";
import { UnigraphObject } from "unigraph-dev-common/lib/utils/utils";

type ABookmark = {
    uid?: string,
    name: string,
    url: string,
    favicon: string,
    children: any[],
    creative_work?: {
        text?: string,
        abstract?: string,
        author?: string
    }
}

export const createBookmark: (t: string, a?: boolean) => Promise<any> = (text: string, add: boolean = true) => {
    let tags_regex = /#[a-zA-Z0-9]*\b ?/gm;
    let tags = text.match(tags_regex) || [];
    tags = tags.map(tag => tag.slice(1).trim());
    text = text.replace(tags_regex, '');

    let url: any;
    let name: any;
    try {
        url = new URL(text.trim());
        name = url.toString();
    } catch (e) {
        name = "Invalid url"
    }
    if (add) {
        window.unigraph.runExecutable(getExecutableId(bookmarkPackage, "add-bookmark"), { url: url, tags: tags })
        return new Promise((res, rej) => { res(undefined as any) });
    } else return new Promise((res, rej) => {
        res({
            name,
            children: tags.map(tagName => {
                return {
                    "type": { "unigraph.id": "$/schema/subentity" },
                    "_value": {
                        "type": { "unigraph.id": "$/schema/tag" },
                        name: tagName
                    }
                }
            })
        })
    })

}

function BookmarksBody({ data }: { data: ABookmark[] }) {

    const bookmarks = data;
    const [newName, setNewName] = useState("");

    return <React.Fragment>
        <DynamicObjectListView
            items={bookmarks}
            context={null} reverse defaultFilter={"no-filter"}
        />
    </React.Fragment>
}

export const Bookmarks = withUnigraphSubscription(
    // @ts-ignore
    BookmarksBody,
    { defaultData: [], schemas: [], packages: [bookmarkPackage] },
    {
        afterSchemasLoaded: (subsId: number, data: any, setData: any) => {
            window.unigraph.subscribeToType("$/schema/web_bookmark", (result: ABookmark[]) => { setData(result) }, subsId, { uidsOnly: true });
        }
    }
)

export const BookmarkItem: DynamicViewRenderer = ({ data, callbacks }) => {
    let unpadded: ABookmark = unpad(data);
    let name = data.get('name').as('primitive');
    let totalCallbacks = callbacks || {
        'onUpdate': (data: Record<string, any>) => {
            throw new Error("not implemented")
            //window.unigraph.updateObject(data.uid, {"done": unpad(data).done});
        }
    };

    return <React.Fragment>
        <ListItemIcon><Avatar alt={"favicon of " + unpadded.name} src={unpadded.favicon}><Public /></Avatar></ListItemIcon>
        <ListItemText>
            <Typography>{name && name !== "No title" ? name : data.get('url').as('primitive')}</Typography>
            <div style={{ display: "inline", alignItems: "center", overflowWrap: "break-word", color: "gray" }}>
                <Link onClick={() => {
                    openUrl(unpadded.url)
                }} style={{ verticalAlign: "middle" }} />
                {typeof unpadded.creative_work?.text === "string" ? <Description onClick={() => {
                    const htmlUid = data?.get('creative_work/text')?.['_value']?.['_value']?.['uid'];
                    if (htmlUid) window.newTab(window.layoutModel, getComponentFromPage('/library/object', { uid: htmlUid, context: data.uid, type: data?.type?.['unigraph.id'] }));
                    if (callbacks?.removeFromContext) callbacks.removeFromContext();
                }} style={{ verticalAlign: "middle" }} /> : []}
                {data?.['_value']?.['children']?.['_value[']?.map ?
                    data['_value']['children']['_value['].map((it: any) => <AutoDynamicView object={new UnigraphObject(it['_value'])} callbacks={callbacks} inline style={{verticalAlign: "middle"}}/>) : []}
                <p style={{ fontSize: "0.875rem", display: "contents" }}>{typeof unpadded.creative_work?.abstract === "string" ? unpadded.creative_work?.abstract : []}</p>
            </div>
        </ListItemText>
    </React.Fragment>
}

const quickAdder = async (inputStr: string, preview = true) => {
    if (!preview) return await createBookmark(inputStr);
    else return [await createBookmark(inputStr, false), '$/schema/web_bookmark']
}

const tt = () => <div>
    For example, enter #tag1 https://example.com
</div>

registerQuickAdder({ 'bookmark': { adder: quickAdder, tooltip: tt }, 'bm': { adder: quickAdder, tooltip: tt } })

registerDynamicViews({ "$/schema/web_bookmark": BookmarkItem })