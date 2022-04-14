import _ from 'lodash/fp';

export type Shortcut = { key: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean };
export const shortcutToString = (shortcut: KeyboardEvent | Shortcut) =>
    `${shortcut.ctrlKey || (shortcut as KeyboardEvent).metaKey ? 'ctrl+' : ''}${shortcut.altKey ? 'alt+' : ''}${
        shortcut.shiftKey ? 'shift+' : ''
    }${shortcut.key}`;

/**
 * Registers a keyboard shortcut for a given component ID
 * @param componentId component ID of the item that wants to register the shortcut.
 * @param shortcut the shortcut to register. For example, `{key: 'k', ctrlKey: true}` for ctrl+k
 * @param callback the function we'll call when the shortcut is triggered.
 * @returns
 */
export const registerKeyboardShortcut = (componentId: string, shortcut: string, callback: (ev: any) => void) => {
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
    return true;
};
