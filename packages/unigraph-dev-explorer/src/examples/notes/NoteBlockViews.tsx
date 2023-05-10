/* eslint-disable react/require-default-props */
import { MouseEventHandler } from 'react';
import { Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { styled } from '@mui/styles';
import { mdiNotebookOutline, mdiNoteOutline, mdiText } from '@mdi/js';
import { Icon } from '@mdi/react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';
import { getSubentities } from './utils';

export function NoteBlock({ data, inline, callbacks }: any) {
    const [parents, references] = getParentsAndReferences(
        data['~_value'],
        (data['unigraph.origin'] || []).filter((el: any) => el.uid !== data.uid),
    );
    const [subentities, otherChildren] = getSubentities(data);
    const { isJournal } = callbacks;

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flexGrow: 1 }}>
                <Typography variant="body1">
                    <Icon
                        path={
                            // eslint-disable-next-line no-nested-ternary
                            isJournal ? mdiNotebookOutline : data._hide ? mdiText : mdiNoteOutline
                        }
                        size={0.8}
                        style={{ opacity: 0.54, marginRight: '4px', verticalAlign: 'text-bottom', display: 'inline' }}
                    />
                    <AutoDynamicView
                        object={data.get('text')?._value._value}
                        options={{ noDrag: true, noDrop: true, inline: true, noContextMenu: true }}
                        callbacks={{
                            'get-semantic-properties': () => data,
                        }}
                    />
                </Typography>
                {inline ? (
                    []
                ) : (
                    <Typography variant="body2" color="textSecondary">
                        {subentities.length} immediate children, {parents.length} parents, {references.length} linked
                        references
                    </Typography>
                )}
            </div>
            <div>
                {otherChildren?.map?.((el: any) => (
                    <AutoDynamicView object={el} options={{ inline: true }} />
                ))}
            </div>
        </div>
    );
}

/** Placeholder note block */
const FillParentWidth = styled('div')({
    width: '100%',
});

const PlaceholderText = styled(Typography)({
    fontStyle: 'italic',
    color: grey[500],
});

export function PlaceholderNoteBlock({ onClick }: { onClick?: MouseEventHandler<HTMLSpanElement> }) {
    return (
        <FillParentWidth>
            <PlaceholderText variant="body1" onClick={onClick}>
                Click here to start writing
            </PlaceholderText>
        </FillParentWidth>
    );
}
