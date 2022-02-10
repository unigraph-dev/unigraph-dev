import { Typography } from '@material-ui/core';
import { mdiNoteOutline } from '@mdi/js';
import { Icon } from '@mdi/react';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { getParentsAndReferences } from '../../components/ObjectView/backlinksUtils';
import { getSubentities } from './utils';

export function NoteBlock({ data, inline }: any) {
    const [parents, references] = getParentsAndReferences(
        data['~_value'],
        (data['unigraph.origin'] || []).filter((el: any) => el.uid !== data.uid),
    );
    const [subentities, otherChildren] = getSubentities(data);

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flexGrow: 1 }}>
                <Typography variant="body1">
                    {data?._hide ? (
                        []
                    ) : (
                        <Icon
                            path={mdiNoteOutline}
                            size={0.8}
                            style={{ opacity: 0.54, marginRight: '4px', verticalAlign: 'text-bottom' }}
                        />
                    )}
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

export function PlaceholderNoteBlock({ callbacks }: any) {
    return (
        <div style={{ width: '100%' }}>
            <Typography
                variant="body1"
                style={{ fontStyle: 'italic' }}
                onClick={() => {
                    callbacks['add-child']();
                }}
            >
                Click here to start writing
            </Typography>
        </div>
    );
}
