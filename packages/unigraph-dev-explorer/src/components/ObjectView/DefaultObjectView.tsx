import { IconButton } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import React, { FC } from 'react';
import ReactJson from 'react-json-view';
import { DefaultObjectContextMenu } from './DefaultObjectContextMenu';

type ObjectViewOptions = {
    viewer?: "string" | "json-tree",
    unpad?: boolean,
    showContextMenu?: boolean,
};

type DefaultObjectViewProps = {
    object: any,
    options: ObjectViewOptions,
};

const StringObjectViewer = ({object}: {object: any}) => {
    return <div>
        {JSON.stringify(object, null, 2)}
    </div>;
}

const JsontreeObjectViewer = ({object}: {object: any}) => {
    return <div>
        <ReactJson src={object} />
    </div>
}

const DefaultObjectView: FC<DefaultObjectViewProps> = ({ object, options }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const finalObject = options.unpad ? window.unigraph.unpad(object) : object
    let FinalObjectViewer;
    const ContextMenuButton: any = options.showContextMenu ? <IconButton 
        aria-label="context-menu"
        onClick={(ev) => {
            setContextMenu(<DefaultObjectContextMenu 
                uid={object.uid}
                object={object} 
                anchorEl={ev.currentTarget} 
                handleClose={()=>{setContextMenu(null)}}/>)
        }}
    >
        <MoreVert />
    </IconButton> : null
    const [ContextMenu, setContextMenu] = React.useState<any>(null);

    switch (options.viewer) {
        case "json-tree":
            FinalObjectViewer = <JsontreeObjectViewer object={finalObject}/>;
            break;
    
        default:
            FinalObjectViewer = <StringObjectViewer object={finalObject}/>;
            break;
    }

    return <div style={{display: "flex", flexDirection: "row"}}>
        {ContextMenuButton} {ContextMenu}
        <div style={{alignSelf: "center"}}>{FinalObjectViewer}</div>
    </div>
}

export default DefaultObjectView;