import React from 'react';
import SchemaEditor from '../components/SchemaEditor';
import Typography from '@material-ui/core/Typography';

const AddSchema = () => {
  return (
    <div>
      <Typography gutterBottom variant="h5">
        Add Schema
      </Typography>
      <SchemaEditor />
    </div>
  );
}

export default AddSchema;