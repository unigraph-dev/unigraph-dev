import { Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { TabContext } from '../../utils';
import { DynamicObjectListView } from './DynamicObjectListView';

const getQuery = (uid: string, forward?: boolean) => `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted))) {
  uid
  <unigraph.id>
  _hide
  type { <unigraph.id> }
}
var(func: uid(${uid})) {
  <${forward ? '~' : ''}unigraph.origin> {
      res as uid
  }
}`;

export function BacklinkView({
    data,
    hideHeader,
    forward,
    callbacks,
    reverse,
    uid,
    titleBar = ' backlinks',
    ...attributes
}: any) {
    const [objects, setObjects]: [any[], any] = React.useState([]);
    const [id, setId] = React.useState(Date.now());
    if (callbacks?.isEmbed) hideHeader = true;

    const tabContext = React.useContext(TabContext);

    useEffectOnce(() => {
        tabContext.subscribeToQuery(
            getQuery(data?.uid || uid, forward),
            (newObjs: any[]) => {
                const finalObjs = newObjs.filter((el: any) => el.uid !== (data?.uid || uid));
                if (!reverse) finalObjs.reverse();
                setObjects(finalObjs);
            },
            id,
            { noExpand: true },
        );
        return function cleanup() {
            tabContext.unsubscribe(id);
        };
    });

    return (
        <DynamicObjectListView
            items={objects}
            titleBar={titleBar}
            context={data || { uid }}
            itemRemover={(uids: any) => {
                if (!forward) {
                    window.unigraph.deleteRelation(data?.uid || uid, {
                        'unigraph.origin': uids.map((el: string) => ({
                            uid: el,
                        })),
                    });
                } else {
                    if (!Array.isArray(uids)) uids = [uids];
                    uids.filter((el: any) => typeof el === 'string').forEach((el: any) =>
                        window.unigraph.deleteRelation(el, {
                            'unigraph.origin': { uid: data?.uid || uid },
                        }),
                    );
                }
            }}
            noRemover
            {...attributes}
        />
    );
}
