import { Card, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';

import GridLayout from 'react-grid-layout'; 
import { AppLibraryWidget } from '../components/PackageManager/AppLibraryWidget';
import { ConnectionWidget } from '../components/UnigraphMeta/ConnectionWidget';
import { TagWidget } from '../examples/semantic/TagWidget';
import './home.css';

export default function ExplorerHome() {

  const layout = [
    {i: 'a', x: 0, y: 0, w: 6, h: 5},
    {i: 'b', x: 6, y: 0, w: 6, h: 8},
    {i: 'c', x: 0, y: 5, w: 6, h: 8},
  ];
  return (
    <React.Fragment>
      <Typography variant="body2">Did you know? You can pop any widget here into its own window by clicking on the bottom right corner.</Typography>
      <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
        <div key="a"><Card variant="outlined" style={{height: "100%", padding: "16px"}}> 
          <TagWidget/>
        </Card></div>
        <div key="b"><Card variant="outlined" style={{height: "100%", padding: "16px"}}> 
          <AppLibraryWidget/>
        </Card></div>
        <div key="c"><Card variant="outlined" style={{height: "100%", padding: "16px"}}> 
          <ConnectionWidget/>
        </Card></div>
      </GridLayout>
    </React.Fragment>
  )
}
