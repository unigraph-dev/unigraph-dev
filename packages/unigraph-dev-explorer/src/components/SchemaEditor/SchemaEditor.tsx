import _ from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useEffectOnce, useList } from 'react-use';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import { SchemaFieldForm, SchemaNameForm } from './SchemaFieldForm';
import { EntityField, EntityFieldInput } from './types';
import { makeUnigraphId, makeRefUnigraphId } from 'unigraph-dev-common/lib/utils/entityUtils';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { Add } from '@material-ui/icons';

/**
 * TODO:
 *  - ability to add indexes
 *  - mark field as required
 */

const useStyles = makeStyles(theme => ({
  root: {
    width: 'max-content',
  }
}));

interface SchemaEditorProps {
  onSubmit(schema: any, preview?: boolean): void;
}

const SchemaEditor: FC<SchemaEditorProps> = ({ onSubmit }) => {
  const classes = useStyles();
  const [name, setName] = useState("$/schema/");
  const [fields, { push, updateAt }] = useList<Partial<EntityFieldInput>>([{}]);
  const [referenceables, setReferenceables] = useState([]);
  const fieldUpdaters = useMemo(() =>
    fields.map((f, i) => (field: EntityFieldInput) => updateAt(i, field)),
    [fields, updateAt]
  );

  useEffectOnce(() => {
    window.unigraph.getReferenceables().then((refs: any) => setReferenceables(refs));
  })

  const addField = useCallback(() => {
    push({});
  }, [push]);

  const handleSubmit = useCallback((event: any, preview: boolean = false) => {
    const _properties: Partial<EntityField>[] = fields.map(
      ({ _key, _definition }) =>
      {
        return {
          _key: _key, 
          _definition: {
            type: _definition ? makeRefUnigraphId(_definition?.type) : undefined
          }
        }
      }
    );

    onSubmit({
      ...makeUnigraphId(name),
      'dgraph.type': 'Type',
      definition: {
        type: makeRefUnigraphId('$/composer/Object'),
        parameters: {
          indexedBy: makeRefUnigraphId('$/primitive/string'),
          indexes: ['name']
        },
        _properties,
      }
    }, preview);
  }, [name, fields, onSubmit]);

  return (
    <Box className={classes.root} flexDirection="column">
      <SchemaNameForm name={name} onChange={setName} />
      {fields.map((field, i) =>
        <SchemaFieldForm key={i} referenceables={referenceables} field={field} onChange={fieldUpdaters[i]} />
      )}
      <Box display="flex" justifyContent="space-between">
        <IconButton onClick={addField}>
          <Add />
        </IconButton>
        <Button onClick={handleSubmit}>Submit</Button>
        <Button onClick={(ev) => handleSubmit(ev, true)}>Preview</Button>
      </Box>
    </Box>
  );
}

export default SchemaEditor;