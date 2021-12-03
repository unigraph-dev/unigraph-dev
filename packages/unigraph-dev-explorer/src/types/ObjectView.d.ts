import React from "react";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";

export type AutoDynamicViewCallbacks = {
    context?: any,
    removeFromContext?: (where: "left" | "right" | undefined) => any,
} & Record<string, any>

export type AutoDynamicViewProps = {
    object: UnigraphObject & any,
    callbacks?: AutoDynamicViewCallbacks,
    component?: Record<string, {view: React.FC<any>, query?: (string) => string}>,
    attributes?: Record<string, any>,
    inline?: boolean,
    allowSubentity?: boolean,
    allowSemantic?: boolean,
    style?: React.CSSProperties,
    noDrag?: boolean,
    noDrop?: boolean,
    noContextMenu?: boolean,
    subentityExpandByDefault?: boolean,
}

export type ContextMenuGenerator = (uid: string, object: any, handleClose: () => any, callbacks?: any, contextUid?: string) => React.ReactElement<any>