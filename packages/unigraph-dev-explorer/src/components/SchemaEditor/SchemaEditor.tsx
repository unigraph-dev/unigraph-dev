import _ from 'lodash';
import React, { useCallback, FC, useMemo } from 'react';
import { useList } from 'react-use';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import SchemaFieldForm from './SchemaFieldForm';
import { EntityField, makeUnigraphId, makeRefUnigraphId } from './types';

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

const SchemaEditor: FC = () => {
  const classes = useStyles();
  const [fields, { push, updateAt }] = useList<Partial<EntityField>>([{}]);
  const fieldUpdaters = useMemo(() =>
    // TODO: uid references in addition to string inputs
    fields.map((f, i) => (field: EntityField) => updateAt(i, field)),
    [fields, updateAt]
  );

  const addField = useCallback(() => {
    push({});
  }, [push]);

  const createData = useCallback(() => {
    const properties = _.fromPairs(
      fields.map(({ key, definition }) => [key, definition?.type])
    );
    const entity = {
      ...makeUnigraphId('$/schema/todo'),
      'dgraph.type': 'Type',
      definition: {
        type: makeRefUnigraphId('$/composer/Object'),
        parameters: {
          indexedBy: makeRefUnigraphId('$/primitive/string'),
          indexes: ['name']
        },
        properties
      }
    };
    window.unigraph.backendConnection.send(JSON.stringify({
      event: 'create_data_by_json',
      data: entity,
    }));
  }, [fields]);

  return (
    <Box className={classes.root} flexDirection="column">
      {fields.map((field, i) =>
        // TODO: use ID of autocomplete entity for key
        <SchemaFieldForm key={i} field={field} onChange={fieldUpdaters[i]} />
      )}
      <Box display="flex" justifyContent="space-between">
        <IconButton onClick={addField}>
          <Add />
        </IconButton>
        <Button onClick={createData}>Submit</Button>
      </Box>
    </Box>
  );
}

export default SchemaEditor;