import _ from 'lodash/fp';
import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { Actions } from 'flexlayout-react';
import { TabContext } from '../../utils';

const getTypeName = (obj: any): string | undefined => {
    const typeEntries: any[] = obj?.type?.['_value['] ?? [];
    return typeEntries.length > 0 ? _.last(typeEntries)._name : undefined;
};
const getObjOrTypeName = (obj: any) => {
    const objName = obj?.get('name')?.as('primitive');
    const typeName = getTypeName(obj);
    return objName ?? typeName;
};
const renameExceptionTypes = ['$/schema/note_block', '$/schema/note_block'];

export const useEntityNameTab = ({
    prefix,
    uid,
    conditionOnObj,
}: {
    prefix: string;
    uid: string;
    conditionOnObj?: any;
}) => {
    const tabContext = React.useContext(TabContext);
    // const [name, setName] = React.useState('Backlink View');
    React.useEffect(() => {
        const subsId = getRandomInt();
        tabContext.subscribeToObject(
            uid,
            (obj: any) => {
                if (conditionOnObj && !conditionOnObj(obj)) {
                    return;
                }

                const tabName = getObjOrTypeName(obj);
                if (tabName !== undefined && tabContext.viewId)
                    window.layoutModel.doAction(Actions.renameTab(tabContext.viewId as any, `${prefix}${tabName}`));
            },
            subsId,
        );

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, []);
};

export const useDetailedObjNameTab = ({ prefix, uid }: { prefix: string; uid: string }) => {
    useEntityNameTab({ prefix, uid, conditionOnObj: (obj: any) => !renameExceptionTypes.includes(obj.getType()) });
};
