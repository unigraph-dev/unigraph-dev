import React, { useState } from 'react';

import { pkg as bookmarkPackage } from 'unigraph-dev-common/lib/data/unigraph.bookmark.pkg';

import { ListItemText, ListItemIcon, Avatar, Typography } from '@material-ui/core';
import { Description, Link, Public } from '@material-ui/icons';
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

export const createBookmark: (t: string, a?: boolean) => Promise<any> = (text: string, add = true) => {
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
        window.unigraph.runExecutable(getExecutableId(bookmarkPackage, 'add-bookmark'), { url, tags });
        return new Promise((res, rej) => {
            res(undefined as any);
        });
    }
    return new Promise((res, rej) => {
        res({
            name,
            children: tags.map((tagName) => ({
                type: { 'unigraph.id': '$/schema/subentity' },
                _value: {
                    type: { 'unigraph.id': '$/schema/tag' },
                    name: tagName,
                },
            })),
        });
    });
};

function BookmarksBody({ data }: { data: ABookmark[] }) {
    const bookmarks = data;
    const [newName, setNewName] = useState('');

    return <DynamicObjectListView items={bookmarks} context={null} reverse defaultFilter="no-filter" />;
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
                <Typography>{name && name !== 'No title' ? name : data.get('url').as('primitive')}</Typography>
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
                                  inline
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
    if (!preview) return await createBookmark(inputStr);
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
