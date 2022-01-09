import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';

export function AppLibrary() {
    const [totalViews, setTotalViews] = React.useState([]);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const viewId = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/view',
            (views: any) => {
                setTotalViews(views);
            },
            viewId,
        );

        return function cleanup() {
            tabContext.unsubscribe(viewId);
        };
    }, []);

    return (
        <div>
            {totalViews.map((el: any) => (
                <AutoDynamicView object={el} />
            ))}
        </div>
    );
}
