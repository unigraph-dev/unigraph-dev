import { Responsive } from 'react-grid-layout';
import { MenuItem, Typography } from '@mui/material';
import React from 'react';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { registerDetailedDynamicViews } from '../../unigraph-react';
import { isMobile } from '../../utils';
import { UnigraphWidget } from './UnigraphWidget';

import '../../pages/home.css';
import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';
import { onUnigraphContextMenu } from '../ObjectView/DefaultObjectContextMenu';
import WidthProvider from '../../utils/WidthProvider';
import { ctxMenuFont } from './ContextMenu';

const ResponsiveGridLayout: any = WidthProvider(Responsive);

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
        <div
            ref={divRef}
            style={{ height: '100%', width: '100%' }}
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
                            <Typography style={ctxMenuFont}>
                                {layoutLocked ? 'Unlock' : 'Lock'} pinboard layout
                            </Typography>
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
                    sm: 600,
                    xxs: 0,
                }}
                cols={{
                    lg: 12,
                    sm: 6,
                    xxs: 2,
                }}
                rowHeight={30}
                compactType="horizontal"
                isDraggable={!isMobile() && !layoutLocked}
                isResizable={!layoutLocked}
                onLayoutChange={(newLayout: any, layouts: any) => {
                    // console.log(newLayout);
                    if (!layoutLocked)
                        window.unigraph.runExecutable('$/executable/update-pinboard-layout', {
                            where: data.uid,
                            newLayout,
                        });
                }}
            >
                {data._value._value.children['_value['].map((el: any) => (
                    <div key={el._value._value.uid}>
                        <UnigraphWidget
                            style={{
                                padding:
                                    new UnigraphObject(el._value._value).get('view/maximize')?.as('primitive') ||
                                    new UnigraphObject(el._value._value).get('maximize')?.as('primitive')
                                        ? ''
                                        : '16px',
                            }}
                        >
                            <AutoDynamicViewDetailed
                                object={new UnigraphObject({ ...el._value._value, _stub: true })}
                                callbacks={callbacks}
                            />
                        </UnigraphWidget>
                    </div>
                ))}
            </ResponsiveGridLayout>
        </div>
    );
}

export const init = () => {
    registerDetailedDynamicViews({
        '$/schema/pinboard': {
            view: Pinboard,
            query: (uid: string) =>
                `(func: uid(${uid})) @recurse(depth: 15) { uid <unigraph.id> expand(_userpredicate_) }`,
        },
    });
};
