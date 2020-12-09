import React, { useCallback, useState, FC } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { EntityField } from './types';

const useStyles = makeStyles(theme => ({
  fieldName: {
    marginRight: 8,
  }
}));

interface SchemaFieldFormProps {
  field: Partial<EntityField>;
  onChange(field: Partial<EntityField>): void;
}

// TODO: be able to autocomplete from existing entities/names
const SchemaFieldForm: FC<SchemaFieldFormProps> = ({ field, onChange }) => {
  const classes = useStyles();
  const setFieldName = useCallback(event => {
    const key = event.target.value;
    onChange({ ...field, key });
  }, [field, onChange]);

  const setFieldType = useCallback(event => {
    const type = event.target.value;
    onChange({ ...field, definition: { type } });
  }, [field, onChange]);

  return (
    <Box className={classes.root} flexDirection="row" justifyContent="space-between">
      <TextField
        className={classes.fieldName}
        label="Name"
        variant="filled"
        onChange={setFieldName}
        value={field.key || ''}
      />
      {/* TODO: should autocomplete w/ base types, user types, or "add new type" from input */}
      <TextField
        label="Type"
        variant="filled"
        onChange={setFieldType}
        value={field.definition?.type || ''}
      />
    </Box>
  );
}

export default SchemaFieldForm;