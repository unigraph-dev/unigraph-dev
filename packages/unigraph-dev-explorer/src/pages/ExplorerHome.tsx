import { Card, Typography } from '@material-ui/core';
import React from 'react';

import sizeMe, { SizeMeProps } from 'react-sizeme';

import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { AppLibraryWidget } from '../components/PackageManager/AppLibraryWidget';
import { ConnectionWidget } from '../components/UnigraphCore/ConnectionWidget';
import { TagWidget } from '../examples/semantic/TagWidget';
import './home.css';
import { isTouchDevice } from '../utils';
import { UnigraphWidget } from '../components/UnigraphCore/UnigraphWidget';

function ExplorerHome({ size } : SizeMeProps) {

  const layout = [
    {i: 'a', x: 0, y: 0, w: 6, h: 8},
    {i: 'b', x: 0, y: 8, w: 12, h: 8},
    {i: 'c', x: 6, y: 0, w: 6, h: 8},
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
        <div key="a"><UnigraphWidget> <TagWidget/> </UnigraphWidget></div>
        <div key="b"><UnigraphWidget> <AppLibraryWidget/> </UnigraphWidget></div>
        <div key="c"><UnigraphWidget> <ConnectionWidget/> </UnigraphWidget></div>
      </ResponsiveGridLayout>
    </React.Fragment>
  )
}

export default sizeMe()(ExplorerHome)
