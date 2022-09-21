import { mdiTagOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { Button, Chip, Divider, TextField } from '@mui/material';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { BacklinkView } from '../../components/ObjectView/BacklinkView';
import { DynamicViewRenderer } from '../../global.d';
import { getContrast } from '../../utils';

const getBgColor = (tag: any) => (tag?.color?.startsWith && tag.color.startsWith('#') ? tag.color : 'unset');
export const Tag: DynamicViewRenderer = ({ data, callbacks }) => {
    const tag = data._value ? unpad(data) : data;

    return (
        <Chip
            size="small"
            icon={
                <Icon
                    path={mdiTagOutline}
                    size={0.75}
                    style={{
                        filter:
                            getBgColor(tag) === 'unset' || getContrast(getBgColor(tag)) === '#666666'
                                ? 'unset'
                                : 'invert(1)',
                    }}
                />
            }
            style={{
                backgroundColor: getBgColor(tag),
                color: getBgColor(tag).startsWith('#') ? getContrast(getBgColor(tag)) : '#666666',
                cursor: 'pointer',
            }}
            variant="outlined"
            label={tag.name}
        />
    );
};

export const TagDetailed: DynamicViewRenderer = ({ data, callbacks }) => {
    const [name, setName] = React.useState('');
    const [uid, setUid] = React.useState('');
    // useNameTab('Tag: ', data.uid);

    React.useEffect(() => {
        const tag = data._value ? unpad(data) : data;
        setName(tag.name);
    }, [data]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '8px',
                alignItems: 'left',
                overflowY: 'hidden',
                height: '100%',
            }}
        >
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
                <Divider orientation="vertical" flexItem style={{ margin: '0px 8px' }} />
                <TextField value={uid} onChange={(e) => setUid(e.target.value)} placeholder="UID of tag to merge with">
                    UID of tag to merge with
                </TextField>
                <Button
                    onClick={async () => {
                        if (uid.startsWith('0x'))
                            window.unigraph.runExecutable('$/executable/merge-entities', { from: uid, to: data.uid });
                    }}
                >
                    Merge selected tag into this tag
                </Button>
            </div>
            <Divider />
            <BacklinkView data={data} titleBar=" backlinks" />
        </div>
    );
};

export const SemanticProperties = ({ data }: any) =>
    data?._value?.children?.['_value[']
        ? data?._value?.children?.['_value['].map((el: any) => <AutoDynamicView object={unpad(el._value)} />)
        : [];
