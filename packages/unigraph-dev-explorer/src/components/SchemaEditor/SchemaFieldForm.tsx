import React, { useCallback, FC } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { EntityField, EntityFieldInput } from './types';
import Autocomplete from '@material-ui/lab/Autocomplete';
import classes from '*.module.css';
import { ReferenceableSelectorControlled } from '../ObjectView/ReferenceableSelector';

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: 8
  },
  fieldSchemaName: {
    marginRight: 8,
  },
  fieldName: {
    marginRight: 8,
  },
  fieldType: {
    display: "inline-flex",
    width: 300,
  }
}));

interface SchemaFieldFormProps {
  field: Partial<EntityFieldInput>;
  referenceables: string[];
  onChange(field: Partial<EntityFieldInput>): void;
}

interface SchemaNameFormProps {
  name: Partial<string>,
  onChange(field: Partial<string>): void;
}

export const SchemaFieldForm: FC<SchemaFieldFormProps> = ({ field, referenceables, onChange }) => {
  const classes = useStyles();
  const setFieldName = useCallback(event => {
    const _key = event.target.value;
    onChange({ ...field, _key });
  }, [field, onChange]);

  const setFieldType = useCallback(value => {
    const type = value;
    onChange({ ...field, _definition: { type } });
  }, [field, onChange]);

  return (
    <Box className={classes.root} flexDirection="row" justifyContent="space-between">
      <TextField
        className={classes.fieldName}
        label="Name"
        variant="filled"
        onChange={setFieldName}
        value={field._key || ''}
      />
      {/* TODO: should also autocomplete w/ "add new type" from input */}
      <ReferenceableSelectorControlled 
        referenceables={referenceables}
        onChange={setFieldType}
        value={field._definition?.type}
      />
    </Box>
  );
}

export const SchemaNameForm: FC<SchemaNameFormProps> = ({ name, onChange }) => {
  const classes = useStyles();

  return (
    <Box className={classes.root} flexDirection="row" justifyContent="space-between">
      <TextField
        className={classes.fieldSchemaName}
        label="Schema Name"
        variant="filled"
        onChange={e => onChange(e.target.value)}
        value={name || ''}
      />
    </Box>
  )
}