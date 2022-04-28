import _ from 'lodash';
import React from 'react';
import { Badger } from '../../utils';
import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';

export function Feeds() {
    const [onUpdate, setOnUpdate] = React.useState(_.noop);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pn = urlParams.get('pageName');
        if (pn === 'Feeds') {
            const myBadge = new Badger({});
            setOnUpdate(() => (data: any) => {
                const badgeCount = data?._value?.children?.['_value[']?.length || undefined;
                myBadge.value = badgeCount;
            });
        }
    }, []);

    return (
        <AutoDynamicViewDetailed
            object={{
                uid: window.unigraph.getNamespaceMap?.()?.['$/entity/feeds']?.uid,
                _stub: true,
                type: { 'unigraph.id': '$/schema/list' },
            }}
            attributes={{ reverse: true, compact: true }}
            onLoad={onUpdate}
        />
    );
}
