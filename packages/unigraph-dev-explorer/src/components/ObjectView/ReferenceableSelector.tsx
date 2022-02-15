import { TextField, Autocomplete } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

export function ReferenceableSelectorControlled({ referenceables, value, onChange }: any) {
    return (
        <Autocomplete
            options={referenceables}
            onChange={(e, v: any) => onChange(v)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Type"
                    variant="filled"
                    value={value || ''}
                    sx={{
                        display: 'inline-flex',
                        width: 300,
                    }}
                />
            )}
        />
    );
}
