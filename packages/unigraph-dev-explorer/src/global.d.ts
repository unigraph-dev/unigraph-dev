import { Model } from "flexlayout-react";
import { ReactElement } from "react";
import { Unigraph } from "unigraph-dev-common/lib/types/unigraph";

declare global {
    interface Window {
        unigraph: Unigraph<WebSocket | undefined>,
        layoutModel: Model,
        registerNotifications: (callback: ((data: any[]) => any)) => any,
        newTab: any,
        closeTab: any,
        crcTable: any,
        wsnavigator: (sth: string) => any,
        electronPreload: any,
        electronShell: any,
    }
};

declare type DynamicViewCallbacks = {
    "onUpdate": (data: Record<string, any>) => any,
}

declare type DynamicViewRenderer = (data: Record<string, any>, callbacks: DynamicViewCallbacks) => ReactElement

declare type UserSettings = {
    serverLocation: string,
    newWindow: "new-tab" | "new-pane" | "new-popout",
    nativeNotifications: boolean,
    developerMode: boolean,
    browserId: string
}

declare module '*.d.ts' {
    const content: string;
    export default content;
}