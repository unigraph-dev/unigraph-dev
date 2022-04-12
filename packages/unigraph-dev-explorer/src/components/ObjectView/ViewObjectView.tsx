import { ListItemIcon, ListItemText } from '@mui/material';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global.d';

export const ViewItem: DynamicViewRenderer = ({ data, callbacks }) => {
    const unpadded: any = unpad(data);

    return (
        <div style={{ display: 'contents' }}>
            {/^\p{Extended_Pictographic}$/u.test(unpadded?.icon || '') ? (
                <div style={{ minWidth: '18px', maxWidth: '18px', minHeight: '18px', marginRight: '20px' }}>
                    <span style={{ fontSize: '1.125em' }}>{unpadded?.icon}</span>
                </div>
            ) : (
                <ListItemIcon
                    style={{
                        minWidth: '20px',
                        minHeight: '20px',
                        marginRight: '18px',
                        backgroundImage: `${
                            unpadded?.icon?.startsWith('data:image/svg+xml,') ? '' : 'url("data:image/svg+xml,'
                        }${unpadded?.icon}")`,
                        opacity: 0.54,
                    }}
                />
            )}
            <ListItemText
                primary={unpadded.name}
                primaryTypographyProps={{ style: { fontSize: '.875rem', letterSpacing: '.2px' } }}
            />
        </div>
    );
};
