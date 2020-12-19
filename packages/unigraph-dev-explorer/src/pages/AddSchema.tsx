import React, { useState, useCallback } from 'react';
import Typography from '@material-ui/core/Typography';
import * as uuid from 'uuid';

import SchemaEditor from '../components/SchemaEditor';
import { makeUnigraphId, makeRefUnigraphId } from '../components/SchemaEditor/types';

const AddSchema = () => {
  const [schemaResult, setSchemaResult] = useState<any>();
  const createSchema = useCallback((schema: any, preview: boolean = false) => {
    const id = uuid.v4();

    const handleResponse = ({ data }: MessageEvent) => {
      const res = JSON.parse(data);
      if (res.id !== id) return;

      // TODO: either return complete schema from backend or get its UID and make a separate request for it here
      // - the res here just has metadata (type/success/request id)
      setSchemaResult(res);

      window.unigraph.backendConnection.removeEventListener('message', handleResponse);
    };

    // TODO: (haojixu) thinking of merging this into a wrapped event system
    window.unigraph.backendConnection.addEventListener('message', handleResponse);

    // TODO: make this more scalable (right now, handleResponse will receive every
    // message sent between when schema is submitted and when response is sent back)
    if (!preview) {
      window.unigraph.backendConnection.send(JSON.stringify({
        type: 'event',
        event: 'create_unigraph_schema',
        schema,
        id,
      }))
    } else {
      setSchemaResult(schema)
    };
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