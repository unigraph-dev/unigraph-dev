import { Card, Typography } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { DynamicObjectListView, TabButton } from '../ObjectView/DynamicObjectListView';
import { getStatsQuery } from '../UnigraphCore/ConnectionWidget';

function MultiTypeDescriptor({ itemGroups, currentType, setCurrentType }: any) {
    return (
        <Card
            variant="outlined"
            style={{
                padding: '12px',
                margin: '12px',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexWrap: 'wrap',
                maxHeight: '20%',
                overflow: 'auto',
            }}
        >
            {itemGroups.map((el: any, index: any) => (
                <TabButton isSelected={currentType === el.name} onClick={() => setCurrentType(el.name)}>
                    <div
                        style={{
                            minHeight: '18px',
                            minWidth: '18px',
                            height: '18px',
                            width: '18px',
                            alignSelf: 'center',
                            marginRight: '3px',
                            opacity: 0.54,
                            backgroundImage: `url("data:image/svg+xml,${
                                window.unigraph.getNamespaceMap?.()?.[el.name]?._icon
                            }")`,
                        }}
                    />
                    <Typography style={{ color: 'grey', marginRight: '4px' }}>
                        {window.unigraph.getNamespaceMap?.()?.[el.name]?._name}:
                    </Typography>
                    <Typography style={{ marginRight: '8px' }}>{el.items}</Typography>
                </TabButton>
            ))}
        </Card>
    );
}

function UserLibraryAll({ id }: any) {
    const [data, setData] = React.useState<any[]>([]);
    const [itemGroups, setItemGroups] = React.useState<any[]>([]);
    const [currentType, setCurrentType] = React.useState<string>('');

    React.useEffect(() => {
        const subsId = getRandomInt();
        if (currentType.length) {
            window.unigraph.subscribeToType(
                currentType,
                (result: any[]) => {
                    setData(result.reverse());
                },
                subsId,
                { metadataOnly: true, first: -500 },
            );
        }
        return function cleanup() {
            window.unigraph.unsubscribe(subsId);
        };
    }, [currentType]);

    useEffectOnce(() => {
        const nsmap = Object.keys(window.unigraph?.getNamespaceMap?.() || {}).filter(
            (el) => el.startsWith('$/schema') && !el.startsWith('$/schema/interface'),
        );
        window.unigraph.getQueries(nsmap.map((el) => getStatsQuery(el))).then((res: any[]) => {
            setItemGroups(
                res.map((el, index) => ({
                    name: nsmap[index],
                    items: el[0]?.objects,
                })),
            );
        });
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <MultiTypeDescriptor itemGroups={itemGroups} currentType={currentType} setCurrentType={setCurrentType} />
            {currentType.length ? (
                <DynamicObjectListView items={data} context={null} defaultFilter={[]} compact noBar />
            ) : (
                <div>
                    <Typography style={{ margin: '12px' }}>Select a type to see items</Typography>
                </div>
            )}
        </div>
    );
}

export default UserLibraryAll;
