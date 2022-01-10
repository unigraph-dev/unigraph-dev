import { makeStyles, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';

const useStyles = makeStyles((theme) => ({
    selector: {
        display: 'inline-flex',
        width: 300,
    },
}));

export function ReferenceableSelectorControlled({ referenceables, value, onChange }: any) {
    const classes = useStyles();

    return (
        <Autocomplete
            className={classes.selector}
            options={referenceables}
            onChange={(e, v: any) => onChange(v)}
            renderInput={(params) => <TextField {...params} label="Type" variant="filled" value={value || ''} />}
        />
    );
}
