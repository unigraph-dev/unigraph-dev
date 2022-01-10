import ReactResizeDetector from 'react-resize-detector';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { MenuItem } from '@material-ui/core';
import React from 'react';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { registerDetailedDynamicViews } from '../../unigraph-react';
import { isMobile } from '../../utils';
import { UnigraphWidget } from './UnigraphWidget';

import '../../pages/home.css';
import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';
import { onUnigraphContextMenu } from '../ObjectView/DefaultObjectContextMenu';

const parseLayout = (it: any) => {
    const [x, y, w, h] = (it._pos || '0:0:6:8').split(':');
    return {
        i: it._value._value.uid,
        x: parseInt(x, 10),
        y: parseInt(y, 10),
        w: parseInt(w, 10),
        h: parseInt(h, 10),
    };
};

export function Pinboard({ data, callbacks }: any) {
    const layout = data._value._value.children['_value['].map(parseLayout);
    // console.log(layout)

    const divRef = React.useRef(null);

    const [layoutLocked, setLayoutLocked] = React.useState(true);

    return (
        <ReactResizeDetector handleWidth targetRef={divRef}>
            {({ width }) => (
                <div
                    ref={divRef}
                    onContextMenu={(event) =>
                        onUnigraphContextMenu(
                            event,
                            data,
                            undefined,
                            undefined,
                            // eslint-disable-next-line react/no-unstable-nested-components
                            (a: any, b: any, handleClose: any) => (
                                <MenuItem
                                    onClick={() => {
                                        handleClose();
                                        setLayoutLocked(!layoutLocked);
                                    }}
                                >
                                    {layoutLocked ? 'Unlock' : 'Lock'} pinboard layout
                                </MenuItem>
                            ),
                        )
                    }
                >
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layout }}
                        breakpoints={{
                            lg: 900,
                            md: 750,
                            sm: 600,
                            xs: 480,
                            xxs: 0,
                        }}
                        cols={{
                            lg: 12,
                            md: 10,
                            sm: 6,
                            xs: 4,
                            xxs: 2,
                        }}
                        rowHeight={30}
                        width={width || 1200}
                        compactType="horizontal"
                        isDraggable={!isMobile() && !layoutLocked}
                        isResizable={!layoutLocked}
                        onLayoutChange={(newLayout: any, layouts) => {
                            window.unigraph.runExecutable('$/executable/update-pinboard-layout', {
                                where: data.uid,
                                newLayout: newLayout.lg,
                            });
                        }}
                    >
                        {data._value._value.children['_value['].map((el: any) => (
                            <div key={el._value._value.uid}>
                                <UnigraphWidget>
                                    <AutoDynamicViewDetailed
                                        object={new UnigraphObject(el._value._value)}
                                        callbacks={callbacks}
                                    />
                                </UnigraphWidget>
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </div>
            )}
        </ReactResizeDetector>
    );
}

export const init = () => {
    registerDetailedDynamicViews({ '$/schema/pinboard': { view: Pinboard } });
};
