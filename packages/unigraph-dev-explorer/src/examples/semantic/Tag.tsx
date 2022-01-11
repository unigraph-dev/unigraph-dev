import { Chip } from '@material-ui/core';
import { LocalOffer } from '@material-ui/icons';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Icon from '@mdi/react';
import { mdiTagOutline } from '@mdi/js';
import { getContrast, NavigationContext } from '../../utils';
import { DynamicViewRenderer } from '../../global.d';
import { registerDynamicViews } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';

export const Tag: DynamicViewRenderer = ({ data, callbacks }) => {
    let tag = data;
    const { uid } = data;
    if (data._value) tag = unpad(data);
    const bgc = tag?.color?.startsWith && tag.color.startsWith('#') ? tag.color : 'unset';
    return (
        <Chip
            size="small"
            icon={
                <Icon
                    path={mdiTagOutline}
                    size={0.75}
                    style={{
                        filter: bgc === 'unset' || getContrast(bgc) === 'black' ? 'unset' : 'invert(1)',
                    }}
                />
            }
            style={{
                backgroundColor: bgc,
                color: bgc.startsWith('#') ? getContrast(bgc) : 'unset',
            }}
            variant="outlined"
            label={tag.name}
            onClick={() => {
                console.log(data);
                window.wsnavigator(`/library/backlink?uid=${uid}`);
            }}
        />
    );
};

export const SemanticProperties = ({ data }: any) =>
    data?._value?.children?.['_value[']
        ? data?._value?.children?.['_value['].map((el: any) => <AutoDynamicView object={unpad(el._value)} />)
        : [];
