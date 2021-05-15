import { Card, Typography } from '@material-ui/core';
import React from 'react';

import sizeMe, { SizeMeProps } from 'react-sizeme';

import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { AppLibraryWidget } from '../components/PackageManager/AppLibraryWidget';
import { ConnectionWidget } from '../components/UnigraphCore/ConnectionWidget';
import { TagWidget } from '../examples/semantic/TagWidget';
import './home.css';
import { ExecutablesWidget } from '../components/UnigraphCore/ExecutablesWidget';
import { isTouchDevice } from '../utils';

function ExplorerHome({ size } : SizeMeProps) {

  const layout = [
    {i: 'a', x: 0, y: 0, w: 6, h: 8},
    {i: 'b', x: 0, y: 8, w: 6, h: 8},
    {i: 'c', x: 6, y: 0, w: 6, h: 8},
    {i: 'd', x: 6, y: 8, w: 6, h: 8},
  ];
  return (
    <React.Fragment>
      <ResponsiveGridLayout 
        className="layout" 
        layouts={{lg: layout}}  
        breakpoints={{lg: 900, md: 750, sm: 600, xs: 480, xxs: 0}} 
        cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}} 
        rowHeight={30} width={size.width ? size.width : 1200}
        compactType="horizontal"
        isDraggable={!isTouchDevice()}
      >
        <div key="a"><Card variant="outlined" style={{height: "100%", padding: "16px"}}> 
          <TagWidget/>
        </Card></div>
        <div key="b"><Card variant="outlined" style={{height: "100%", padding: "16px"}}> 
          <AppLibraryWidget/>
        </Card></div>
        <div key="c"><Card variant="outlined" style={{height: "100%", padding: "16px"}}> 
          <ConnectionWidget/>
        </Card></div>
        <div key="d"><Card variant="outlined" style={{height: "100%", padding: "16px"}}> 
          <ExecutablesWidget/> 
        </Card></div>
      </ResponsiveGridLayout>
    </React.Fragment>
  )
}

export default sizeMe()(ExplorerHome)
