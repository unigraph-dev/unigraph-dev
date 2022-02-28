import React, { useState } from 'react';

import { pkg as bookmarkPackage } from 'unigraph-dev-common/lib/data/unigraph.bookmark.pkg';

import { ListItemText, ListItemIcon, Avatar, Typography, Fab } from '@mui/material';
import { Description, Link, Public, Add as AddIcon } from '@mui/icons-material';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { getExecutableId } from 'unigraph-dev-common/lib/api/unigraph';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicViewRenderer } from '../../global.d';
import { registerDynamicViews, registerQuickAdder, withUnigraphSubscription } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { getComponentFromPage } from '../../utils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';

type ABookmark = {
    uid?: string;
    name: string;
    url: string;
    favicon: string;
    children: any[];
    creative_work?: {
        text?: string;
        abstract?: string;
        author?: string;
    };
};

export const createBookmark = async (text: string, add = true) => {
    const tagsRegex = /#[a-zA-Z0-9]*\b ?/gm;
    let tags = text.match(tagsRegex) || [];
    tags = tags.map((tag) => tag.slice(1).trim());
    text = text.replace(tagsRegex, '');

    let url: any;
    let name: any;
    try {
        url = new URL(text.trim());
        name = url.toString();
    } catch (e) {
        name = 'Invalid url';
    }
    if (add) {
        const uid = await window.unigraph.runExecutable(getExecutableId(bookmarkPackage, 'add-bookmark'), {
            url,
            tags,
        });
        console.log('createBookmark', { url, tags, uid });
        if (tags.length === 0) {
            window.unigraph.runExecutable(
                '$/executable/add-item-to-list',
                {
                    where: '$/entity/inbox',
                    item: uid,
                },
                undefined,
                undefined,
                true,
            );
        }
        return uid;
    }
    return {
        name,
        children: tags.map((tagName) => ({
            type: { 'unigraph.id': '$/schema/subentity' },
            _value: {
                type: { 'unigraph.id': '$/schema/tag' },
                name: tagName,
            },
        })),
    };
};

function BookmarksBody({ data }: { data: ABookmark[] }) {
    const bookmarks = data;

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            <DynamicObjectListView items={bookmarks} context={null} reverse defaultFilter="no-filter" />
            <Fab
                aria-label="add"
                style={{ position: 'absolute', right: '16px', bottom: '16px' }}
                onClick={() => {
                    window.unigraph.getState('global/omnibarSummoner').setValue({
                        show: true,
                        tooltip: 'Add a bookmark',
                        defaultValue: '+bookmark ',
                    });
                }}
            >
                <AddIcon />
            </Fab>
        </div>
    );
}

export const Bookmarks = withUnigraphSubscription(
    BookmarksBody,
    { defaultData: [], schemas: [], packages: [bookmarkPackage] },
    {
        afterSchemasLoaded: (subsId: number, tabContext: any, data: any, setData: any) => {
            tabContext.subscribeToType(
                '$/schema/web_bookmark',
                (result: ABookmark[]) => {
                    setData(result);
                },
                subsId,
                { uidsOnly: true },
            );
        },
    },
);

export const BookmarkItem: DynamicViewRenderer = ({ data, callbacks }) => {
    const unpadded: ABookmark = unpad(data);
    const name = data.get('name')?.as('primitive') || '';
    const totalCallbacks = callbacks;

    return (
        <>
            <ListItemIcon>
                <Avatar alt={`favicon of ${unpadded.name}`} src={unpadded.favicon}>
                    <Public />
                </Avatar>
            </ListItemIcon>
            <ListItemText>
                <Typography>{name && name !== 'No title' ? name : data.get('url')?.as('primitive')}</Typography>
                <div
                    style={{
                        display: 'inline',
                        alignItems: 'center',
                        overflowWrap: 'break-word',
                        color: 'gray',
                    }}
                >
                    <Link
                        onClick={() => {
                            window.open(unpadded.url, '_blank');
                        }}
                        style={{ verticalAlign: 'middle' }}
                    />
                    {typeof unpadded.creative_work?.text === 'string' ? (
                        <Description
                            onClick={() => {
                                const htmlUid = data?.get('creative_work/text')?._value?._value?.uid;
                                if (htmlUid)
                                    window.newTab(
                                        window.layoutModel,
                                        getComponentFromPage('/library/object', {
                                            uid: htmlUid,
                                            context: data.uid,
                                            type: data?.type?.['unigraph.id'],
                                        }),
                                    );
                                if (callbacks?.removeFromContext && callbacks?.removeOnEnter)
                                    callbacks.removeFromContext();
                            }}
                            style={{ verticalAlign: 'middle' }}
                        />
                    ) : (
                        []
                    )}
                    {data?._value?.children?.['_value[']?.map
                        ? data._value.children['_value['].map((it: any) => (
                              <AutoDynamicView
                                  object={new UnigraphObject(it._value)}
                                  callbacks={callbacks}
                                  options={{ inline: true }}
                                  style={{ verticalAlign: 'middle' }}
                              />
                          ))
                        : []}
                    <p style={{ fontSize: '0.875rem', display: 'contents' }}>
                        {typeof unpadded.creative_work?.abstract === 'string' ? unpadded.creative_work?.abstract : []}
                    </p>
                </div>
            </ListItemText>
        </>
    );
};

const quickAdder = async (inputStr: string, preview = true) => {
    // eslint-disable-next-line no-return-await
    if (!preview) {
        const uid = await createBookmark(inputStr);
        console.log('adding bookmark', { uid, inputStr });
        return uid;
    }
    return [await createBookmark(inputStr, false), '$/schema/web_bookmark'];
};

export const init = () => {
    const description = 'Add a bookmark';
    const tt = () => <div>For example, enter #tag1 https://example.com</div>;

    registerQuickAdder({
        bookmark: {
            adder: quickAdder,
            tooltip: tt,
            description,
            alias: ['bm'],
        },
    });

    registerDynamicViews({ '$/schema/web_bookmark': BookmarkItem });
};
