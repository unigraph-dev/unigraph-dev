import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';

export const AppLibrary = () => {

    const [totalViews, setTotalViews] = React.useState([]);

    React.useEffect(() => {
        const viewId = getRandomInt();

        window.unigraph.subscribeToType('$/schema/view', (views: any) => {
            setTotalViews(views)
        }, viewId);

        return function cleanup () { window.unigraph.unsubscribe(viewId) }
    })

    return <div>
        {totalViews.map((el: any) =>
            <AutoDynamicView object={el}/>)}
    </div>

}