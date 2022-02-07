import React from 'react';
import { UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';

export type AutoDynamicViewCallbacks = {
    context?: any;
    removeFromContext?: (where: 'left' | 'right' | undefined) => any;
} & Record<string, any>;

export type AutoDynamicViewProps = {
    object: UnigraphObject & any;
    callbacks?: AutoDynamicViewCallbacks;
    components?: Record<string, { view: React.FC<any>; query?: (string) => string }>;
    attributes?: Record<string, any>;
    style?: React.CSSProperties;
    index?: number;
    onClick?: any;
    shortcuts?: any;
    options?: DynamicViewOptions;
};

export type DynamicViewOptions = {
    /** If set to true, AutoDynamicView will not navigate to detailed view even if it has one. */
    noClickthrough?: boolean;
    /** If set to true, AutoDynamicView will not display subentity & annotation. */
    noSubentities?: boolean;
    /** If set to true, AutoDynamicView will expand subentity & annotation by default. */
    subentityExpandByDefault?: boolean;
    /** If set to true, AutoDynamicView will not calculate backlinks. */
    noBacklinks?: boolean;
    /** If set to true, AutoDynamicView will not listen for context menu events. */
    noContextMenu?: boolean;
    /** If set to true, object will not be draggable. */
    noDrag?: boolean;
    /** If set to true, object will not be droppable. */
    noDrop?: boolean;
    /** If set to true, object will display with the inline variant with styling. */
    inline?: boolean;
    /** If set to true, AutoDynamicView will allow objects to be dropped as subentities. */
    allowSubentity?: boolean;
    /** If set to true, AutoDynamicView will allow objects to be dropped as semantic properties. */
    allowSemantic?: boolean;
    /** If set to true, AutoDynamicView will not consider parents of this view when calculating backlinks. */
    noParents?: boolean;
    /** If set to true, object will display with the compact variant. */
    compact?: boolean;
    /** If set to true, AutoDynamicView will use a custom bounding box to determine various things related (backlink display, draggability, etc), WIP */
    customBoundingBox?: boolean;
    /** If set to true, AutoDynamicView will consider the object with children already displayed when considering recursion, etc, WIP */
    expandedChildren?: boolean;
};

export type DynamicViewRendererProps = {
    view: any;
    query: any;
    onClick?: any;
    shortcuts?: any;
    options?: DynamicViewOptions;
};

export type ContextMenuGenerator = (
    uid: string,
    object: any,
    handleClose: () => any,
    callbacks?: any,
    contextUid?: string,
) => React.ReactElement<any>;
