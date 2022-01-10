import { Chip } from '@material-ui/core';
import { mdiPlayOutline } from '@mdi/js';
import React from 'react';
import Icon from '@mdi/react';

export function SubentityView({ data, callbacks }: any) {
    const objDef = window.unigraph.getNamespaceMap?.()?.[data?._value?.type?.['unigraph.id']];

    return (
        <Chip
            size="small"
            icon={
                <div
                    style={{
                        minWidth: '16px',
                        minHeight: '16px',
                        marginLeft: '2px',
                        marginRight: '-4px',
                        backgroundImage: `url("data:image/svg+xml,${objDef?._icon}")`,
                        opacity: 0.54,
                    }}
                />
            }
            variant="outlined"
            label={`Child: ${objDef?._name}`}
        />
    );
}
