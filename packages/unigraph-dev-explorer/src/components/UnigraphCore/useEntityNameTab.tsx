import _ from 'lodash/fp';
import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { Actions } from 'flexlayout-react';
import { TabContext } from '../../utils';
import { isStub } from '../ObjectView/utils';

const getType = (obj: any): any | undefined => {
    const typeEntries: any[] = obj?.type?.['_value['] ?? [];
    return typeEntries.length > 0 ? _.last(typeEntries) : undefined;
};
const getObjOrTypeName = (obj: any) => {
    const objName = obj?.get?.('name')?.as('primitive');
    const objTextName = obj?.get?.('text')?.as('primitive');
    const typeName = getType(obj)?._name;
    return objName ?? objTextName ?? typeName;
};

const getObjOrTypeIcon = (obj: any) => {
    const objIcon = obj?.get?.('icon')?.as('primitive');
    const typeIcon = getType(obj)?._icon;
    return objIcon ?? typeIcon;
};
// const renameExceptionTypes = ['$/schema/note_block', '$/schema/note_block'];
const renameExceptionTypes: string[] = [];

export const useEntityNameTab = ({
    prefix,
    conditionOnObj,
    object,
}: {
    prefix: string;
    conditionOnObj?: any;
    object?: any;
}) => {
    const tabContext = React.useContext(TabContext);
    const [renamerId] = React.useState(getRandomInt());
    const renamer = React.useCallback(
        (obj) => {
            const tabName = getObjOrTypeName(obj);
            const tabIcon = getObjOrTypeIcon(obj);
            if (tabName !== undefined && tabContext.viewId)
                tabContext.setTitle(`${prefix}${tabName}`, tabIcon, renamerId);
        },
        [tabContext, prefix],
    );

    // const [name, setName] = React.useState('Backlink View');
    React.useEffect(() => {
        const subsId = getRandomInt();
        if (isStub(object) && object.uid) {
            tabContext.subscribeToObject(
                object.uid,
                (obj: any) => {
                    if (conditionOnObj && !conditionOnObj(obj)) {
                        return;
                    }

                    renamer(obj);
                },
                subsId,
            );
        } else {
            renamer(object);
        }

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, [object]);
};

export const useDetailedObjNameTab = ({ prefix, object }: { prefix: string; object?: any }) => {
    useEntityNameTab({
        prefix,
        object,
        conditionOnObj: (obj: any) => !renameExceptionTypes.includes(obj.getType()),
    });
};
