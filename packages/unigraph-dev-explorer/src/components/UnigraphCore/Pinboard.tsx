import { registerDetailedDynamicViews } from "../../unigraph-react"
import { isTouchDevice } from '../../utils';
import { UnigraphWidget } from '../../components/UnigraphCore/UnigraphWidget';

import ReactResizeDetector from 'react-resize-detector';

import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import '../../pages/home.css';
import { AutoDynamicViewDetailed } from "../ObjectView/AutoDynamicViewDetailed";
import { onUnigraphContextMenu } from "../ObjectView/DefaultObjectContextMenu";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import React from "react";
import { MenuItem } from "@material-ui/core";

const parseLayout = (it: any) => {
    const [x, y, w, h] = (it._pos || "0:0:6:8").split(':');
    return {i: it._value._value.uid, x: parseInt(x), y: parseInt(y), w: parseInt(w), h: parseInt(h)}
}

export const Pinboard = ({data}: any) => {
    const layout = data._value._value.children['_value['].map(parseLayout)
    //console.log(layout)

    const divRef = React.useRef(null);

    const [layoutLocked, setLayoutLocked] = React.useState(true);

    return <ReactResizeDetector handleWidth targetRef={divRef}>
        {({width}) => <div ref={divRef} onContextMenu={(event) => onUnigraphContextMenu(event, data, undefined, undefined, (handleClose: any) => <React.Fragment>
            <MenuItem onClick={() => {handleClose(); setLayoutLocked(!layoutLocked);}}>{layoutLocked ? "Unlock" : "Lock"} pinboard layout</MenuItem>
        </React.Fragment>)}>
            <ResponsiveGridLayout 
                className="layout" 
                layouts={{lg: layout}}  
                breakpoints={{lg: 900, md: 750, sm: 600, xs: 480, xxs: 0}} 
                cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}} 
                rowHeight={30} width={width ? width : 1200}
                compactType="horizontal"
                isDraggable={!isTouchDevice() && !layoutLocked}
                isResizable={!layoutLocked}
                onLayoutChange={(layout, layouts) => {
                    window.unigraph.runExecutable('$/executable/update-pinboard-layout', {where: data.uid, newLayout: layouts.lg});
                }}
            >
                {data._value._value.children['_value['].map((el: any) => <div key={el._value._value.uid}>
                    <UnigraphWidget>
                        <AutoDynamicViewDetailed object={new UnigraphObject(el._value._value)} />
                    </UnigraphWidget>
                </div>)}
            </ResponsiveGridLayout>
        </div>}
    </ReactResizeDetector>
}

export const pb_init = () => {
    registerDetailedDynamicViews({"$/schema/pinboard": {view: Pinboard}})
}