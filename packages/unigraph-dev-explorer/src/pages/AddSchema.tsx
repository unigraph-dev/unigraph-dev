import React, { useState, useCallback } from 'react';
import Typography from '@material-ui/core/Typography';

import SchemaEditor from '../components/SchemaEditor';

const AddSchema = () => {
  const [schemaResult, setSchemaResult] = useState<any>();
  const createSchema = useCallback((schema: any, preview: boolean = false) => {

    if (!preview) window.unigraph.createSchema(schema).then((response) => {
      setSchemaResult(response);
    }); else setSchemaResult(schema);

  }, []);

  return (
    <div>
      <Typography gutterBottom variant="h5">
        Add Schema
      </Typography>
      <SchemaEditor onSubmit={createSchema} />
      {schemaResult && (
        <pre>{JSON.stringify(schemaResult, null, 2)}</pre>
      )}
    </div>
  );
}

export default AddSchema;