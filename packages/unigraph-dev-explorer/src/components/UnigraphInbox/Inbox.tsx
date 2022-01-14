import _ from 'lodash';
import React from 'react';
import { Badger } from '../../utils';
import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';

export function Inbox() {
    const [onUpdate, setOnUpdate] = React.useState(_.noop);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pn = urlParams.get('pageName');
        if (pn === 'inbox') {
            const myBadge = new Badger({});
            setOnUpdate(() => (data: any) => {
                const badgeCount = data?._value?.children?.['_value[']?.length || undefined;
                console.log(badgeCount);
                myBadge.value = badgeCount;
            });
        }
    }, []);

    return (
        <AutoDynamicViewDetailed
            object={{
                uid: window.unigraph.getNamespaceMap?.()?.['$/entity/inbox']?.uid,
                _stub: true,
                type: { 'unigraph.id': '$/schema/list' },
            }}
            attributes={{ removeOnEnter: true }}
            onLoad={onUpdate}
        />
    );
}
