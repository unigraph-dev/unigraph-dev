import _ from 'lodash';
import React, { useCallback, FC, useMemo } from 'react';
import { useList } from 'react-use';
import Button from '@material-ui/core/Button';

import SchemaFieldForm from './SchemaFieldForm';
import { EntityField, makeUnigraphId, makeRefUnigraphId } from './types';

const SchemaEditor: FC = () => {
  const [fields, { updateAt }] = useList<Partial<EntityField>>([{}]);
  const fieldUpdaters = useMemo(() =>
    // TODO: uid references in addition to string inputs
    fields.map((f, i) => (field: EntityField) => updateAt(i, field)),
    [fields, updateAt]
  );

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
    <>
      {fields.map((field, i) =>
        // TODO: use ID of autocomplete entity for key
        <SchemaFieldForm key={i} field={field} onChange={fieldUpdaters[i]} />
      )}
      <Button onClick={createData}>Submit</Button>
    </>
  );
}

export default SchemaEditor;