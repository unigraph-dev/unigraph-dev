export type Shortcut = { key: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean };

/**
 * Registers a keyboard shortcut for a given component ID
 * @param componentId component ID of the item that wants to register the shortcut.
 * @param shortcut the shortcut to register. For example, `{key: 'k', ctrlKey: true}` for ctrl+k
 * @param callback the function we'll call when the shortcut is triggered.
 * @returns
 */
export const registerKeyboardShortcut = (componentId: string, shortcut: string, callback: (ev: any) => void) => {
    const dict = window.unigraph.getState('global/keyboardShortcuts').value;
    if (!dict[shortcut]) {
        dict[shortcut] = { [componentId]: callback };
    } else {
        dict[shortcut][componentId] = callback;
    }
    window.unigraph.getState('global/keyboardShortcuts').setValue(dict);
    return true;
};

export const removeKeyboardShortcut = (componentId: string, shortcut?: string) => {
    const dict = window.unigraph.getState('global/keyboardShortcuts').value;
    if (!shortcut) {
        // remove all shortcuts for this component
        Object.keys(dict).forEach((key) => {
            delete dict[key][componentId];
        });
    } else if (dict[shortcut]) {
        // remove this shortcut
        delete dict[shortcut][componentId];
    }

    window.unigraph.getState('global/keyboardShortcuts').setValue(dict);
};

export const shortcutToString = (shortcut: KeyboardEvent | Shortcut) =>
    `${shortcut.ctrlKey || (shortcut as KeyboardEvent).metaKey ? 'ctrl+' : ''}${shortcut.altKey ? 'alt+' : ''}${
        shortcut.shiftKey ? 'shift+' : ''
    }${shortcut.key}`;

const shortcutHandler = (ev: KeyboardEvent) => {
    if (ev.location !== 1 && ev.location !== 2) {
        // not modifier keys
        const keyStr = shortcutToString(ev);

        // now we check if there's a registered shortcut for this key
        const dict = window.unigraph.getState('global/keyboardShortcuts').value;
        const shortcuts = Object.keys(dict);

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
                const matchingComponents = hasComponents.map((el: string) => dict[keyStr][el]).filter(Boolean);
                matchingComponents.forEach((callback: any) => {
                    callback(ev);
                });
                console.log(`ran ${matchingComponents.length} callbacks`);
            }
        }
    }
};

export const initKeyboardShortcuts = () => {
    document.addEventListener('keydown', shortcutHandler);

    return true;
};
