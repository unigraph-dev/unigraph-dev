import _ from 'lodash/fp';
import { getComponentDataById } from './utils';

export type Shortcut = { key: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean };
export const shortcutToString = (shortcut: KeyboardEvent) => {
    const primaryKey =
        shortcut.key === 'Dead' || (shortcut.altKey && shortcut.code.startsWith('Key') && shortcut.code.length === 4)
            ? shortcut.code.replace('Key', '').toLowerCase()
            : shortcut.key;

    const str = `${shortcut.ctrlKey || shortcut.metaKey ? 'ctrl+' : ''}${shortcut.altKey ? 'alt+' : ''}${
        shortcut.shiftKey ? 'shift+' : ''
    }${primaryKey}`;
    return str;
};

/**
 * Registers a keyboard shortcut for a given component ID
 * @param componentId component ID of the item that wants to register the shortcut.
 * @param shortcut the shortcut to register. For example, `{key: 'k', ctrlKey: true}` for ctrl+k
 * @param callback the function we'll call when the shortcut is triggered.
 * @returns
 */
export const registerKeyboardShortcut = (
    componentId: string,
    shortcut: string,
    callback: (ev: any, components?: any[]) => void,
) => {
    const shortcutDict = window.unigraph.getState('global/keyboardShortcuts').value;
    if (!shortcutDict[shortcut]) {
        shortcutDict[shortcut] = { [componentId]: callback };
    } else {
        shortcutDict[shortcut][componentId] = callback;
    }
    window.unigraph.getState('global/keyboardShortcuts').setValue(shortcutDict);
    return true;
};

export const removeKeyboardShortcut = (componentId: string, shortcut?: string) => {
    const shortcutDict = window.unigraph.getState('global/keyboardShortcuts').value;
    if (!shortcut) {
        // remove all shortcuts for this component
        Object.keys(shortcutDict).forEach((key) => {
            delete shortcutDict[key][componentId];
        });
    } else if (shortcutDict[shortcut]) {
        // remove this shortcut
        delete shortcutDict[shortcut][componentId];
    }

    window.unigraph.getState('global/keyboardShortcuts').setValue(shortcutDict);
};

const shortcutHandler = (ev: KeyboardEvent, specialEvent?: string) => {
    if (ev.location !== 1 && ev.location !== 2) {
        // not modifier keys
        const keyStr = specialEvent || shortcutToString(ev);

        // now we check if there's a registered shortcut for this key
        const shortcutDict = window.unigraph.getState('global/keyboardShortcuts').value;
        const shortcuts = Object.keys(shortcutDict);

        if (shortcuts.includes(keyStr)) {
            const selectedState = window.unigraph.getState('global/selected');
            const focusedState = window.unigraph.getState('global/focused');
            let hasComponents = [];
            if (selectedState.value.length) {
                hasComponents = selectedState.value;
            } else if (focusedState.value.component) {
                hasComponents = [focusedState.value.component];
            }
            if (hasComponents.length > 0) {
                const matchingComponents = hasComponents.map((el: string) => shortcutDict[keyStr][el]).filter(Boolean);

                const retFns: any[] = [];
                matchingComponents.forEach((callback: any) => {
                    const ret = callback(ev);
                    if (typeof ret === 'function') retFns.push(ret);
                });
                retFns.forEach((fn: any) => {
                    fn(ev);
                });
                if (shortcutDict[keyStr].any) {
                    shortcutDict[keyStr].any(ev, hasComponents);
                    console.log(`ran generic callback on ${hasComponents.length} objects`);
                }
                console.log(`ran ${matchingComponents.length} callbacks`);
            }
        }
    }
};

const hotkeyHandler = (ev: KeyboardEvent, specialEvent?: string) => {
    // handler for the most recent implementation of hotkeys, using global commands
    if (ev.location !== 1 && ev.location !== 2) {
        // not modifier keys
        const keyStr = specialEvent || shortcutToString(ev);

        // now we check if there's a registered shortcut for this key
        const shortcutDict = window.unigraph.getState('global/hotkeyBindings').value;
        const shortcuts = Object.keys(shortcutDict);
        if (shortcuts.includes(keyStr)) {
            const getContextState = () => {
                const selectedState = window.unigraph.getState('global/selected');
                const focusedState = window.unigraph.getState('global/focused');
                if (selectedState.value.length) {
                    return selectedState.value;
                }
                return focusedState.value.component ? [focusedState.value.component] : undefined;
            };

            const commandName = _.prop([keyStr, '_value', 'command', '_value', 'unigraph.id'], shortcutDict);
            ev.preventDefault();
            // optional chaining here because the function is optional in the common API, because it's present in explorer but not backend
            window.unigraph.dispatchCommand?.(commandName, {}, { contextState: getContextState(), invoker: 'hotkey' });
        }
    }
};

export const initKeyboardShortcuts = () => {
    document.addEventListener('keydown', shortcutHandler); // old hotkey implementation
    document.addEventListener('keydown', hotkeyHandler); // new command-based hotkeys
    document.addEventListener('cut', (ev: any) => shortcutHandler(ev, 'oncut')); // old hotkey implementation
    document.addEventListener('copy', (ev: any) => shortcutHandler(ev, 'oncopy')); // old hotkey implementation

    // TODO: move shortcuts here to new command-based impl
    registerKeyboardShortcut('any', 'alt+i', (ev: any, components?: any[]) => {
        const uids = (components || []).map((comp) => getComponentDataById(comp).uid);
        if (!uids.length) return;
        window.unigraph.getState('global/selected').setValue([]);
        window.unigraph.runExecutable('$/executable/add-item-to-list', {
            where: '$/entity/inbox',
            item: uids,
        });
    });

    registerKeyboardShortcut('any', 'alt+r', (ev: any, components?: any[]) => {
        const uids = (components || []).map((comp) => getComponentDataById(comp).uid);
        if (!uids.length) return;
        window.unigraph.getState('global/selected').setValue([]);
        window.unigraph.runExecutable('$/executable/add-item-to-list', {
            where: '$/entity/read_later',
            item: uids,
        });
    });

    registerKeyboardShortcut('any', 'alt+e', (ev: any, components?: any[]) => {
        const uids = (components || []).map((comp) => getComponentDataById(comp).uid);
        if (uids.length !== 1) return;
        window.unigraph.getState('global/selected').setValue([]);
        window.wsnavigator(`/object-editor?uid=${uids[0]}`);
    });

    registerKeyboardShortcut('any', 'alt+shift+d', (ev: any, components?: any[]) => {
        if (!components || !components.length) return;
        window.unigraph.getState('global/selected').setValue([]);
        const uids = (components || []).map((comp) => getComponentDataById(comp).uid);
        const { callbacks } = getComponentDataById(components[0]);
        const ctx = getComponentDataById(components[0]).dataContext.contextData;
        const otherCtx = (components || [])
            .map((comp) => getComponentDataById(comp).dataContext.contextUid)
            .filter((el) => el !== ctx.uid);
        if (otherCtx.length || !callbacks.removeFromContext) return;
        callbacks.removeFromContext(uids);
    });

    registerKeyboardShortcut('any', 'alt+shift+f', (ev: any, components?: any[]) => {
        if (!components || components.length !== 1) return;
        window.unigraph.getState('global/selected').setValue([]);
        const { callbacks } = getComponentDataById(components[0]);
        if (!callbacks.removeFromContext) return;
        callbacks.removeFromContext('left');
    });

    registerKeyboardShortcut('any', 'Escape', (ev: any, components?: any[]) => {
        if (window.unigraph.getState('global/selected').value.length)
            window.unigraph.getState('global/selected').setValue([]);
    });

    return true;
};
