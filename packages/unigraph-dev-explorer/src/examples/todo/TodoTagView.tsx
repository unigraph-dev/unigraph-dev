import { Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import { buildGraph } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { TabContext } from '../../utils';
import { completeTodoQueryBody, groupers } from './utils';

const getQuery = (uid: string, forward?: boolean) => `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted))) {
  ${completeTodoQueryBody}
}
var(func: uid(${uid})) {
  <${forward ? '~' : ''}unigraph.origin> {
      res as uid
  }
}`;

export function TodoTagView({
    data,
    hideHeader,
    forward,
    callbacks,
    reverse,
    uid,
    titleBar = ' tagged items',
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
                const finalObjs = buildGraph(newObjs).filter((el: any) => el.uid !== (data?.uid || uid));
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
            groupers={groupers}
            {...attributes}
        />
    );
}
