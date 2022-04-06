import { Chip, TextField, Button } from '@mui/material';
import { LocalOffer } from '@mui/icons-material';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import Icon from '@mdi/react';
import { mdiTagOutline } from '@mdi/js';
import React from 'react';
import { getContrast, NavigationContext } from '../../utils';
import { DynamicViewRenderer } from '../../global.d';
import { registerDynamicViews } from '../../unigraph-react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { BacklinkView } from '../../components/ObjectView/BacklinkView';

const getBgColor = (tag: any) => (tag?.color?.startsWith && tag.color.startsWith('#') ? tag.color : 'unset');
export const Tag: DynamicViewRenderer = ({ data, callbacks }) => {
    const [tag, setTag] = React.useState(() => (data._value ? unpad(data) : data));

    return (
        <Chip
            size="small"
            icon={
                <Icon
                    path={mdiTagOutline}
                    size={0.75}
                    style={{
                        filter:
                            getBgColor(tag) === 'unset' || getContrast(getBgColor(tag)) === 'black'
                                ? 'unset'
                                : 'invert(1)',
                    }}
                />
            }
            style={{
                backgroundColor: getBgColor(tag),
                color: getBgColor(tag).startsWith('#') ? getContrast(getBgColor(tag)) : 'unset',
            }}
            variant="outlined"
            label={tag.name}
            onClick={() => {
                console.log(data);
                window.wsnavigator(`/library/backlink?uid=${data.uid}`);
            }}
        />
    );
};

export const TagDetailed: DynamicViewRenderer = ({ data, callbacks }) => {
    const [name, setName] = React.useState('');

    React.useEffect(() => {
        const tag = data._value ? unpad(data) : data;
        setName(tag.name);
    }, [data]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px', alignItems: 'left' }}>
            <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'left' }}>
                <TextField value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag Name">
                    Tag Name
                </TextField>
                <Button
                    onClick={async () => {
                        window.unigraph.runExecutable('$/executable/rename-entity', { uid: data.uid, newName: name });
                    }}
                >
                    Rename Tag
                </Button>
            </div>
            <BacklinkView data={data} titleBar=" backlinks" />;
        </div>
    );
};

export const SemanticProperties = ({ data }: any) =>
    data?._value?.children?.['_value[']
        ? data?._value?.children?.['_value['].map((el: any) => <AutoDynamicView object={unpad(el._value)} />)
        : [];
