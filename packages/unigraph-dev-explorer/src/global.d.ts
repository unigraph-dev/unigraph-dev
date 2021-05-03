import { ReactElement } from "react";
import { Unigraph } from "unigraph-dev-common";

declare global {
    interface Window {
        unigraph: Unigraph;
        DynamicViews: Record<string, DynamicViewRenderer>,
        DynamicViewsDetailed: Record<string, DynamicViewRenderer>
    }
};

declare type DynamicViewCallbacks = {
    "onUpdate": (data: Record<string, any>) => any,
}

declare type DynamicViewRenderer = (data: Record<string, any>, callbacks: DynamicViewCallbacks) => ReactElement

declare module 'javascript-time-ago' {
    function foo(): void; 
    export = foo;
};