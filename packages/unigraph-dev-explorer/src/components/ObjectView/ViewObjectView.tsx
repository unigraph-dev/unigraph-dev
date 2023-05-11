import { ListItemIcon, ListItemText } from '@mui/material';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global.d';

export const ViewItem: DynamicViewRenderer = ({ data, callbacks }) => {
    const unpadded: any = unpad(data);

    return (
        <div className="flex items-center">
            {/^\p{Extended_Pictographic}|\p{Emoji_Presentation}$/u.test(unpadded?.icon || '') ? (
                <div style={{ minWidth: '18px', maxWidth: '18px', minHeight: '18px', marginRight: '20px' }}>
                    <span style={{ fontSize: '1.125em' }}>{unpadded?.icon}</span>
                </div>
            ) : (
                <ListItemIcon
                    style={{
                        minWidth: '16px',
                        minHeight: '16px',
                        marginRight: '10px',
                        backgroundImage: `${
                            unpadded?.icon?.startsWith('data:image/svg+xml,') ? '' : 'url("data:image/svg+xml,'
                        }${unpadded?.icon}")`,
                        opacity: 0.54,
                    }}
                />
            )}
            <span className="text-slate-600 text-[13px] font-medium">{unpadded.name}</span>
        </div>
    );
};
