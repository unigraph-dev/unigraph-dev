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
    inline?: boolean;
    allowSubentity?: boolean;
    allowSemantic?: boolean;
    style?: React.CSSProperties;
    noDrag?: boolean;
    noDrop?: boolean;
    noContextMenu?: boolean;
    noSubentities?: boolean;
    noBacklinks?: boolean;
    noParents?: boolean;
    withParent?: boolean;
    subentityExpandByDefault?: boolean;
    compact?: boolean;
    index?: number;
    noClickthrough?: boolean;
    onClick?: any;
    recursive?: boolean;
    shortcuts?: any;
    customBoundingBox?: boolean;
    expandedChildren?: boolean;
};

export type DynamicViewRendererProps = {
    view: any;
    query: any;
    noClickthrough?: boolean;
    noSubentities?: boolean;
    noBacklinks?: boolean;
    noContextMenu?: boolean;
    noDrag?: boolean;
    noDrop?: boolean;
    shortcuts?: any;
    onClick?: any;
};

export type ContextMenuGenerator = (
    uid: string,
    object: any,
    handleClose: () => any,
    callbacks?: any,
    contextUid?: string,
) => React.ReactElement<any>;
