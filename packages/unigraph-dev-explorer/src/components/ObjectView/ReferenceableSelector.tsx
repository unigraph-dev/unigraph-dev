import { TextField, Autocomplete } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const PREFIX = 'ReferenceableSelector';

const classes = {
    selector: `${PREFIX}-selector`,
};

const StyledTextField = styled(TextField)(({ theme }) => ({
    [`& .${classes.selector}`]: {
        display: 'inline-flex',
        width: 300,
    },
}));

export function ReferenceableSelectorControlled({ referenceables, value, onChange }: any) {
    return (
        <Autocomplete
            className={classes.selector}
            options={referenceables}
            onChange={(e, v: any) => onChange(v)}
            renderInput={(params) => <StyledTextField {...params} label="Type" variant="filled" value={value || ''} />}
        />
    );
}
