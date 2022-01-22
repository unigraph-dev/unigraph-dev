import { Model } from 'flexlayout-react';
import { ReactElement } from 'react';
import { Unigraph } from 'unigraph-dev-common/lib/types/unigraph';

declare global {
    interface Window {
        unigraph: Unigraph<WebSocket | undefined>;
        layoutModel: Model;
        registerNotifications: (callback: (data: any[]) => any) => any;
        newTab: any;
        closeTab: any;
        crcTable: any;
        wsnavigator: (sth: string) => any;
        electronPreload: any;
        electronShell: any;
        reloadCommands: () => any;
        mixpanel?: any;
        dragselect: any;
    }
}

declare type DynamicViewCallbacks = {
    onUpdate: (data: Record<string, any>) => any;
};

declare type DynamicViewRenderer = (data: Record<string, any>, callbacks: DynamicViewCallbacks) => ReactElement;

declare type UserSettings = {
    serverLocation: string;
    newWindow: 'new-tab' | 'new-pane' | 'new-popout';
    nativeNotifications: boolean;
    developerMode: boolean;
    browserId: string;
};

declare type ContextMenuState = {
    anchorPosition: { top: number; left: number };
    menuContent: ((
        uid: string,
        object: any,
        onfire: () => any,
        callbacks?: any,
        contextUid?: string,
    ) => React.ReactElement)[];
    contextObject: any;
    contextUid: string;
    schemaMenuContent: ((
        uid: string,
        object: any,
        onfire: () => any,
        callbacks?: any,
        contextUid?: string,
    ) => React.ReactElement)[];
    menuContextContent: ((
        uid: string,
        object: any,
        onfire: () => any,
        callbacks?: any,
        contextUid?: string,
    ) => React.ReactElement)[];
    contextContextObject?: any;
    contextContextUid?: string;
    removeFromContext?: string;
    callbacks?: any;
    extraContent: any;
    windowName?: string;
    show: boolean;
};

declare type SearchPopupState = {
    anchorPosition?: { top: number; left: number };
    anchorEl?: any;
    show: boolean;
    search?: string;
    hideHidden?: boolean;
    onSelected?: (newName: string, newUid: string) => any;
    default: {
        label: (search: string) => string;
        onSelected: (search: string) => Promise<string>;
    }[];
};
declare module '*.d.ts' {
    const content: string;
    export default content;
}
