import { Divider, ListItemIcon, Typography } from '@material-ui/core';
import { mdiCubeOutline, mdiDatabaseOutline, mdiTimelineClockOutline } from '@mdi/js';
import Icon from '@mdi/react';
import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { TabContext, timeSince } from '../../utils';

function ObjectOverview({ data }: any) {
    const objDef = window.unigraph.getNamespaceMap?.()?.[data?.type?.['unigraph.id']];
    const name = new UnigraphObject(data['unigraph.indexes']?.name || {})?.as('primitive');

    return (
        <div style={{ padding: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <ListItemIcon style={{ minWidth: '32px', alignSelf: 'baseline' }}>
                    <Icon path={mdiCubeOutline} size={0.8} style={{ margin: '4px' }} />
                </ListItemIcon>
                <Typography>{name ? `${name} (${data.uid})` : data.uid}</Typography>
            </span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
                {objDef?._icon ? (
                    <ListItemIcon
                        style={{
                            minWidth: '20px',
                            minHeight: '20px',
                            marginLeft: '4px',
                            marginRight: '8px',
                            backgroundImage: `url("data:image/svg+xml,${objDef?._icon}")`,
                            opacity: 0.54,
                        }}
                    />
                ) : (
                    <ListItemIcon
                        style={{
                            minWidth: '32px',
                            marginLeft: '12px',
                        }}
                    >
                        <Icon path={mdiDatabaseOutline} size={0.8} />
                    </ListItemIcon>
                )}
                <Typography>{objDef?._name || data?.type?.['unigraph.id']}</Typography>
            </span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <ListItemIcon style={{ minWidth: '32px' }}>
                    <Icon path={mdiTimelineClockOutline} size={0.8} style={{ margin: '4px' }} />
                </ListItemIcon>
                <Typography>{timeSince(new Date(data._updatedAt))}</Typography>
            </span>
        </div>
    );
}

export function InspectorView() {
    const [selected, setSelected] = React.useState<string[]>([]);
    const [objectsMap, _setObjectsMap] = React.useState<any>({});
    const objectsMapRef = React.useRef<any>({});
    const subIdMapRef = React.useRef<Record<string, any>>({});
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const subsId = getRandomInt();
        const options = {
            queryFn: `(func: uid(QUERYFN_TEMPLATE)) { uid <dgraph.type> type { <unigraph.id> } _updatedAt _createdAt _hide unigraph.indexes {
                uid 
                expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
                  uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
              } } `,
        };

        tabContext.subscribeToObject(
            window.unigraph.getState('global/selected').value,
            (objs: any[]) => {
                setSelected(Array.isArray(objs) ? objs : [objs]);
            },
            subsId,
            options,
        );

        setSelected(window.unigraph.getState('global/selected').value);
        window.unigraph.getState('global/selected').subscribe((newVal: string[]) => {
            tabContext.subscribe(
                {
                    type: 'object',
                    uid: newVal,
                    options,
                },
                () => false,
                subsId,
                true,
            );
        });

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, []);

    return (
        <div style={{ padding: '8px' }}>
            {selected.length === 0 ? (
                <Typography>Select items to inspect</Typography>
            ) : (
                <div>
                    <Typography>{`Selected ${selected.length?.toString()} items.`}</Typography>
                    <Divider />
                    {selected.map((obj: any) => (
                        <>
                            <ObjectOverview data={obj} />
                            <Divider />
                        </>
                    ))}
                </div>
            )}
        </div>
    );
}
