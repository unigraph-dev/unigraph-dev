export type Hooks = Record<string, Function[]>

export function callHooks(hooks: Hooks, type: string, context = {}) {
    if (Object.keys(hooks).includes(type)) hooks[type].forEach(val => val(context));
}

// Default hooks
// TODO: Convert existing updates to hooks