import React from "react";
import { UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";

export type AutoDynamicViewCallbacks = {
    context?: any,
    removeFromContext?: (where: "left" | "right" | undefined) => any,
} & Record<string, any>

export type AutoDynamicViewProps = {
    object: UnigraphObject & any,
    callbacks?: AutoDynamicViewCallbacks,
    component?: Record<string, React.FC<any>>,
    attributes?: Record<string, any>,
    inline?: boolean,
    allowSubentity?: boolean
}